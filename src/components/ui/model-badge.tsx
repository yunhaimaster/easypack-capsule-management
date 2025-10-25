import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Brain, Sparkles, Zap } from 'lucide-react';

type ModelType = 'gpt' | 'claude' | 'grok' | 'gpt-mini' | 'deepseek' | 'info';

interface ModelBadgeProps {
  model: ModelType;
  className?: string;
  showIcon?: boolean;
}

const modelConfig: Record<ModelType, {
  label: string;
  icon: React.ElementType;
  className: string;
}> = {
  'gpt': {
    label: 'GPT-5',
    icon: Brain,
    className: 'bg-success-500/10 text-success-700 border-success-500/20 hover:bg-success-500/20',
  },
  'claude': {
    label: 'Claude',
    icon: Sparkles,
    className: 'bg-info-500/10 text-info-700 border-info-500/20 hover:bg-info-500/20',
  },
  'grok': {
    label: 'Grok',
    icon: Zap,
    className: 'bg-warning-500/10 text-warning-700 border-warning-500/20 hover:bg-warning-500/20',
  },
  'gpt-mini': {
    label: 'GPT-5 Mini',
    icon: Brain,
    className: 'bg-secondary-500/10 text-secondary-700 border-secondary-500/20 hover:bg-secondary-500/20',
  },
  'deepseek': {
    label: 'DeepSeek',
    icon: Brain,
    className: 'bg-info-500/10 text-info-700 border-info-500/20 hover:bg-info-500/20',
  },
  'info': {
    label: 'AI 模型',
    icon: Sparkles,
    className: 'bg-info-500/10 text-info-700 border-info-500/20 hover:bg-info-500/20',
  },
};

export function ModelBadge({ model, className, showIcon = true }: ModelBadgeProps) {
  const config = modelConfig[model];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium transition-all duration-300 ease-apple',
        config.className,
        className
      )}
    >
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  );
}

/**
 * 用於共識分析的特殊標籤
 */
export function ConsensusBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium transition-all duration-300 ease-apple',
        'bg-gradient-to-r from-emerald-500/10 via-violet-500/10 to-orange-500/10',
        'text-neutral-800 dark:text-white/95 border-neutral-300',
        'hover:from-emerald-500/20 hover:via-violet-500/20 hover:to-orange-500/20',
        className
      )}
    >
      <Sparkles className="w-3 h-3 mr-1" />
      跨模型共識
    </Badge>
  );
}

