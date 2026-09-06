import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';

const CopyButton = ({ text }: { text: string }) => {
  const t = useTranslations('Applications');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      title={copied ? t('copied') : t('copy')}
      aria-label={copied ? t('copied') : t('copy')}
      className="inline-flex shrink-0 items-center rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
    >
      {copied
        ? <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
        : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
    </button>
  );
};

export default CopyButton;
