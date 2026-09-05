import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Fragment } from 'react';
import { Transition, TransitionChild } from '@headlessui/react';
import { ChevronLeft, ChevronRight, X, Keyboard } from 'lucide-react';
import { useTourStore } from '../stores/tourStore';
import { TOUR_STEPS } from '../config/tourSteps';
import { getShortcutDisplay } from '../stores/shortcutsStore';

/** Spotlight 区域的位置和尺寸 */
interface SpotlightRect {
    top: number;
    left: number;
    width: number;
    height: number;
}

/** 根据 placement 和目标位置计算卡片位置 */
const calcCardPosition = (
    target: SpotlightRect,
    placement: 'top' | 'bottom' | 'left' | 'right',
    cardWidth: number,
    cardHeight: number,
): { top: number; left: number; actualPlacement: 'top' | 'bottom' | 'left' | 'right' } => {
    const gap = 16;
    const margin = 16;
    let top = 0;
    let left = 0;
    let actualPlacement = placement;

    switch (placement) {
        case 'bottom':
            top = target.top + target.height + gap;
            left = target.left + target.width / 2 - cardWidth / 2;
            // Flip to top if overflows bottom
            if (top + cardHeight > window.innerHeight - margin) {
                top = target.top - cardHeight - gap;
                actualPlacement = 'top';
            }
            break;
        case 'top':
            top = target.top - cardHeight - gap;
            left = target.left + target.width / 2 - cardWidth / 2;
            // Flip to bottom if overflows top
            if (top < margin) {
                top = target.top + target.height + gap;
                actualPlacement = 'bottom';
            }
            break;
        case 'right':
            top = target.top + target.height / 2 - cardHeight / 2;
            left = target.left + target.width + gap;
            // Flip to left if overflows right
            if (left + cardWidth > window.innerWidth - margin) {
                left = target.left - cardWidth - gap;
                actualPlacement = 'left';
            }
            break;
        case 'left':
            top = target.top + target.height / 2 - cardHeight / 2;
            left = target.left - cardWidth - gap;
            // Flip to right if overflows left
            if (left < margin) {
                left = target.left + target.width + gap;
                actualPlacement = 'right';
            }
            break;
    }

    // Clamp within viewport
    left = Math.max(margin, Math.min(left, window.innerWidth - cardWidth - margin));
    top = Math.max(margin, Math.min(top, window.innerHeight - cardHeight - margin));

    return { top, left, actualPlacement };
};

/** 选择平台感知的快捷键显示 */
const pickShortcutForPlatform = (keys: string[]): string | undefined => {
    if (!keys || keys.length === 0) return undefined;
    const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent || navigator.platform || '');
    const preferred = isMac
        ? keys.find(k => k.toLowerCase().includes('meta') || k.toLowerCase().includes('cmd'))
        : keys.find(k => k.toLowerCase().includes('ctrl'));
    return preferred || keys[0];
};

const GuidedTour: React.FC = () => {
    const { isActive, currentStep, nextStep, prevStep, skipTour, completeTour } = useTourStore();
    const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
    const [cardPosition, setCardPosition] = useState<{ top: number; left: number } | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);

    const totalSteps = TOUR_STEPS.length;
    const step = TOUR_STEPS[currentStep];
    const isLastStep = currentStep === totalSteps - 1;
    const isFirstStep = currentStep === 0;

    /** 根据 data-tour 属性查找目标元素并计算 spotlight 位置 */
    const updateSpotlight = useCallback(() => {
        if (!isActive || !step) return;

        const target = document.querySelector(`[data-tour="${step.targetSelector}"]`);

        if (target) {
            const rect = target.getBoundingClientRect();
            const padding = step.spotlightPadding ?? 8;
            setSpotlightRect({
                top: rect.top - padding,
                left: rect.left - padding,
                width: rect.width + padding * 2,
                height: rect.height + padding * 2,
            });
        } else {
            // 目标元素不存在时（如快捷键步骤），居中显示卡片
            setSpotlightRect(null);
        }
    }, [isActive, step]);

    /** 更新卡片位置 */
    const updateCardPosition = useCallback(() => {
        if (!isActive || !step || !cardRef.current) return;

        const cardRect = cardRef.current.getBoundingClientRect();

        if (spotlightRect) {
            const { top, left } = calcCardPosition(
                spotlightRect,
                step.placement,
                cardRect.width,
                cardRect.height,
            );
            setCardPosition({ top, left });
        } else {
            // 无 spotlight 时居中
            setCardPosition({
                top: window.innerHeight / 2 - cardRect.height / 2,
                left: window.innerWidth / 2 - cardRect.width / 2,
            });
        }
    }, [isActive, step, spotlightRect]);

    // 步骤变化时重新定位 spotlight
    useEffect(() => {
        if (!isActive) return;

        // 小延迟以等待 DOM 更新
        const timer = setTimeout(updateSpotlight, 100);
        return () => clearTimeout(timer);
    }, [isActive, currentStep, updateSpotlight]);

    // spotlight 变化时更新卡片位置
    useEffect(() => {
        // 等 cardRef 渲染后再计算
        const timer = setTimeout(updateCardPosition, 50);
        return () => clearTimeout(timer);
    }, [spotlightRect, updateCardPosition]);

    // 监听窗口变化
    useEffect(() => {
        if (!isActive) return;

        const handleResize = () => {
            updateSpotlight();
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleResize, true);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleResize, true);
        };
    }, [isActive, updateSpotlight]);

    // 监听目标元素的变化（如面板显示/隐藏）
    useEffect(() => {
        if (!isActive || !step) return;

        const target = document.querySelector(`[data-tour="${step.targetSelector}"]`);
        if (!target) return;

        resizeObserverRef.current = new ResizeObserver(() => {
            updateSpotlight();
        });
        resizeObserverRef.current.observe(target);

        return () => {
            resizeObserverRef.current?.disconnect();
        };
    }, [isActive, step, updateSpotlight]);

    // ESC 键跳过引导
    useEffect(() => {
        if (!isActive) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                skipTour();
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [isActive, skipTour]);

    const handleNext = useCallback(() => {
        if (isLastStep) {
            completeTour();
        } else {
            nextStep();
        }
    }, [isLastStep, completeTour, nextStep]);

    if (!isActive || !step) return null;

    // 生成 overlay clip-path（在 spotlight 位置切出透明窗口）
    const overlayClipPath = spotlightRect
        ? `polygon(
            0% 0%, 0% 100%, 
            ${spotlightRect.left}px 100%, 
            ${spotlightRect.left}px ${spotlightRect.top}px, 
            ${spotlightRect.left + spotlightRect.width}px ${spotlightRect.top}px, 
            ${spotlightRect.left + spotlightRect.width}px ${spotlightRect.top + spotlightRect.height}px, 
            ${spotlightRect.left}px ${spotlightRect.top + spotlightRect.height}px, 
            ${spotlightRect.left}px 100%, 
            100% 100%, 100% 0%
          )`
        : undefined;

    // 渲染快捷键标签
    const renderShortcutKeys = () => {
        if (!step.shortcutKeys || step.shortcutKeys.length === 0) return null;

        // 将所有快捷键分组显示
        const keyGroups = step.shortcutKeys.map(keyStr => {
            const displayKey = pickShortcutForPlatform([keyStr]);
            return displayKey ? getShortcutDisplay(displayKey) : [];
        });

        return (
            <div className="mt-3 flex flex-wrap items-center gap-3">
                {keyGroups.map((parts, groupIdx) => (
                    <div key={groupIdx} className="flex items-center gap-1">
                        {groupIdx > 0 && (
                            <span className="mx-1 text-xs text-gray-400">/</span>
                        )}
                        {parts.map((part, idx) => (
                            <kbd
                                key={idx}
                                className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-gray-100 px-1.5 text-[11px] font-semibold text-gray-600 border border-gray-200/80 shadow-sm"
                            >
                                {part}
                            </kbd>
                        ))}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <Transition appear show={isActive} as={Fragment}>
            {/* 固定定位容器 */}
            <div className="fixed inset-0 z-[100]">
                {/* 半透明遮罩 + Spotlight 切割 */}
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div
                        className="absolute inset-0 bg-black/50 transition-all duration-300"
                        style={{
                            clipPath: overlayClipPath,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </TransitionChild>

                {/* Spotlight 高亮边框（圆角矩形） */}
                {spotlightRect && (
                    <div
                        className="pointer-events-none absolute rounded-xl ring-2 ring-blue-400/60 transition-all duration-300 ease-out"
                        style={{
                            top: spotlightRect.top,
                            left: spotlightRect.left,
                            width: spotlightRect.width,
                            height: spotlightRect.height,
                        }}
                    >
                        {/* 脉冲动画 */}
                        <div className="absolute inset-0 animate-pulse rounded-xl ring-2 ring-blue-400/30" />
                    </div>
                )}

                {/* 提示卡片 */}
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 translate-y-2"
                    enterTo="opacity-100 translate-y-0"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 translate-y-2"
                >
                    <div
                        ref={cardRef}
                        className="absolute w-[340px] rounded-2xl bg-white p-5 shadow-2xl border border-gray-100"
                        style={{
                            top: cardPosition?.top ?? -9999,
                            left: cardPosition?.left ?? -9999,
                            transition: 'top 0.3s ease-out, left 0.3s ease-out',
                        }}
                    >
                        {/* 卡片头部：步骤标签 + 关闭 */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="flex h-5 items-center rounded-full bg-blue-50 px-2 text-[10px] font-bold text-blue-600 uppercase tracking-wide">
                                    {currentStep + 1} / {totalSteps}
                                </div>
                                {step.shortcutKeys && step.shortcutKeys.length > 0 && (
                                    <Keyboard className="h-3.5 w-3.5 text-gray-400" />
                                )}
                            </div>
                            <button
                                onClick={skipTour}
                                className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                                aria-label="关闭引导"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        {/* 标题 */}
                        <h3 className="text-[15px] font-semibold text-gray-900 mb-1.5">
                            {step.title}
                        </h3>

                        {/* 描述 */}
                        <p className="text-[13px] leading-relaxed text-gray-500">
                            {step.description}
                        </p>

                        {/* 快捷键展示 */}
                        {renderShortcutKeys()}

                        {/* 底部导航 */}
                        <div className="mt-4 flex items-center justify-between">
                            {/* 进度圆点 */}
                            <div className="flex items-center gap-1.5">
                                {TOUR_STEPS.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-1.5 rounded-full transition-all duration-200 ${
                                            idx === currentStep
                                                ? 'w-4 bg-blue-500'
                                                : idx < currentStep
                                                    ? 'w-1.5 bg-blue-300'
                                                    : 'w-1.5 bg-gray-200'
                                        }`}
                                    />
                                ))}
                            </div>

                            {/* 导航按钮 */}
                            <div className="flex items-center gap-2">
                                {!isFirstStep && (
                                    <button
                                        onClick={prevStep}
                                        className="flex h-8 items-center gap-1 rounded-lg px-3 text-[12px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5" />
                                        上一步
                                    </button>
                                )}
                                <button
                                    onClick={handleNext}
                                    className="flex h-8 items-center gap-1 rounded-lg bg-blue-500 px-4 text-[12px] font-medium text-white hover:bg-blue-600 transition-colors shadow-sm"
                                >
                                    {isLastStep ? '完成' : '下一步'}
                                    {!isLastStep && <ChevronRight className="h-3.5 w-3.5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </TransitionChild>
            </div>
        </Transition>
    );
};

export default GuidedTour;
