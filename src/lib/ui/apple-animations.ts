/**
 * Apple HIG Standard Animation System
 * 
 * 遵循 Apple Human Interface Guidelines 的動畫規範
 * 所有動畫使用統一的時長和 easing 函數
 */

// Apple 標準 Easing Functions
export const appleEasing = {
  // 標準 ease - 用於大多數過渡
  standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  
  // Ease In - 元素進入畫面
  in: 'cubic-bezier(0.4, 0.0, 1, 1)',
  
  // Ease Out - 元素離開畫面
  out: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  
  // Spring - iOS 風格彈性動畫
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  
  // Sharp - 快速精準的過渡
  sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)',
} as const;

// Apple 標準動畫時長
export const appleDuration = {
  // Instant - 即時反饋（按鈕按下）
  instant: 100,
  
  // Fast - 快速過渡（hover 效果）
  fast: 200,
  
  // Normal - 標準過渡（大多數動畫）
  normal: 300,
  
  // Slow - 慢速過渡（大型元素移動）
  slow: 500,
  
  // Slower - 更慢過渡（複雜動畫）
  slower: 700,
} as const;

// 預設動畫配置
export const appleAnimations = {
  // 標準過渡
  standard: `${appleDuration.normal}ms ${appleEasing.standard}`,
  
  // 快速過渡
  fast: `${appleDuration.fast}ms ${appleEasing.standard}`,
  
  // 即時反饋
  instant: `${appleDuration.instant}ms ${appleEasing.standard}`,
  
  // Spring 彈性
  spring: `${appleDuration.normal}ms ${appleEasing.spring}`,
  
  // 淡入
  fadeIn: `${appleDuration.normal}ms ${appleEasing.out}`,
  
  // 淡出
  fadeOut: `${appleDuration.normal}ms ${appleEasing.in}`,
} as const;

// 觸控反饋動畫
export const touchFeedback = {
  // 按下縮小（iOS 風格）
  press: {
    transform: 'scale(0.97)',
    transition: appleAnimations.instant,
  },
  
  // 釋放恢復
  release: {
    transform: 'scale(1)',
    transition: appleAnimations.fast,
  },
  
  // Hover 提升
  hover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
    transition: appleAnimations.standard,
  },
} as const;

// 無障礙動畫設置
export const accessibleAnimation = {
  // 尊重用戶的動畫偏好設置
  respectMotionPreference: `
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  `,
} as const;

// 常用動畫組合
export const appleAnimationPresets = {
  // 卡片互動
  cardInteractive: {
    default: {
      transition: `all ${appleAnimations.standard}`,
    },
    hover: {
      transform: 'translateY(-4px)',
      boxShadow: '0 16px 48px rgba(0, 0, 0, 0.12)',
    },
    active: {
      transform: 'scale(0.98)',
    },
  },
  
  // 按鈕互動
  buttonInteractive: {
    default: {
      transition: `all ${appleAnimations.fast}`,
    },
    hover: {
      transform: 'scale(1.02)',
      opacity: 0.9,
    },
    active: {
      transform: 'scale(0.97)',
    },
  },
  
  // Icon 容器互動
  iconInteractive: {
    default: {
      transition: `transform ${appleAnimations.standard}`,
    },
    hover: {
      transform: 'scale(1.1) rotate(5deg)',
    },
    active: {
      transform: 'scale(0.95)',
    },
  },
  
  // 淡入動畫
  fadeIn: {
    initial: {
      opacity: 0,
      transform: 'translateY(10px)',
    },
    animate: {
      opacity: 1,
      transform: 'translateY(0)',
      transition: appleAnimations.fadeIn,
    },
  },
  
  // 滑入動畫
  slideIn: {
    initial: {
      opacity: 0,
      transform: 'translateX(-20px)',
    },
    animate: {
      opacity: 1,
      transform: 'translateX(0)',
      transition: appleAnimations.standard,
    },
  },
} as const;

// CSS class 生成器
export function generateAnimationClasses() {
  return `
/* Apple HIG Standard Animations */

/* Standard Transitions */
.transition-apple {
  transition: all ${appleAnimations.standard};
}

.transition-apple-fast {
  transition: all ${appleAnimations.fast};
}

.transition-apple-instant {
  transition: all ${appleAnimations.instant};
}

/* Touch Feedback */
.touch-feedback {
  transition: transform ${appleAnimations.instant};
}

.touch-feedback:active {
  transform: scale(0.97);
}

.touch-feedback-hover {
  transition: all ${appleAnimations.standard};
}

.touch-feedback-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.touch-feedback-hover:active {
  transform: scale(0.98);
}

/* Interactive Card */
.card-interactive {
  transition: all ${appleAnimations.standard};
}

.card-interactive:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
}

.card-interactive:active {
  transform: scale(0.98);
}

/* Button Press Effect */
.button-press {
  transition: transform ${appleAnimations.fast};
}

.button-press:active {
  transform: scale(0.97);
}

/* Accessibility - Respect Motion Preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
`;
}

// Export as named constant to satisfy ESLint
const appleAnimationSystem = {
  easing: appleEasing,
  duration: appleDuration,
  animations: appleAnimations,
  touchFeedback,
  presets: appleAnimationPresets,
  generateClasses: generateAnimationClasses,
};

export default appleAnimationSystem;


