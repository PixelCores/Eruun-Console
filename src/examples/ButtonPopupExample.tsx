import { useState } from "react";
import { Button } from "../components/ui/Button";
import {
    PortalToFollowElem,
    PortalToFollowElemContent,
    PortalToFollowElemTrigger,
} from "../components/ui/PortalToFollowElem";

const ButtonPopupExample = () => {
    const [loading, setLoading] = useState(false);

    const toggleLoading = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 2000);
    };

    return (
        <div className="p-8 space-y-8 bg-background-body min-h-screen">
            <h1 className="text-2xl font-bold text-text-primary">Button & Popup System</h1>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-text-secondary">Buttons</h2>

                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-text-tertiary">Variants</h3>
                    <div className="flex flex-wrap gap-4">
                        <Button variant="primary">Primary</Button>
                        <Button variant="secondary">Secondary</Button>
                        <Button variant="secondary-accent">Secondary Accent</Button>
                        <Button variant="tertiary">Tertiary</Button>
                        <Button variant="ghost">Ghost</Button>
                        <Button variant="ghost-accent">Ghost Accent</Button>
                        <Button variant="warning">Warning</Button>
                        <Button variant="destructive">Destructive</Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-text-tertiary">Sizes</h3>
                    <div className="flex flex-wrap items-center gap-4">
                        <Button size="small">Small</Button>
                        <Button size="medium">Medium</Button>
                        <Button size="large">Large</Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-text-tertiary">States</h3>
                    <div className="flex flex-wrap gap-4">
                        <Button disabled>Disabled</Button>
                        <Button loading={loading} onClick={toggleLoading}>
                            Click to Load
                        </Button>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-text-secondary">Popups (Floating UI)</h2>

                <div className="flex gap-8">
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-text-tertiary">Click Trigger</h3>
                        <PortalToFollowElem placement="bottom-start">
                            <PortalToFollowElemTrigger>
                                <Button>Open Menu</Button>
                            </PortalToFollowElemTrigger>
                            <PortalToFollowElemContent className="w-48 p-2">
                                <div className="flex flex-col gap-1">
                                    <Button variant="ghost" className="justify-start w-full">Profile</Button>
                                    <Button variant="ghost" className="justify-start w-full">Settings</Button>
                                    <div className="h-px bg-divider-subtle my-1" />
                                    <Button variant="ghost" className="justify-start w-full text-red-500 hover:text-red-600">Logout</Button>
                                </div>
                            </PortalToFollowElemContent>
                        </PortalToFollowElem>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-text-tertiary">Hover Trigger</h3>
                        <PortalToFollowElem trigger="hover" placement="right-start">
                            <PortalToFollowElemTrigger>
                                <Button variant="secondary">Hover Me</Button>
                            </PortalToFollowElemTrigger>
                            <PortalToFollowElemContent className="p-4 w-64">
                                <h4 className="font-medium text-text-primary mb-1">Information</h4>
                                <p className="text-sm text-text-secondary">
                                    This popup appears on hover and is positioned to the right.
                                </p>
                            </PortalToFollowElemContent>
                        </PortalToFollowElem>
                    </div>
                </div>
            </section>
        </div>
    );
};

export { ButtonPopupExample };
