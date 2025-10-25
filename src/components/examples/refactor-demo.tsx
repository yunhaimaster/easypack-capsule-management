'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Text } from '@/components/ui/text'
import { Container } from '@/components/ui/container'
import { IconContainer } from '@/components/ui/icon-container'
import { Plus, FileText, Clock3 } from 'lucide-react'

/**
 * Demo showing the refactoring from manual dark mode classes to unified components
 */

export function RefactorDemo() {
  return (
    <Container.Page>
      <Container.Section className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* OLD APPROACH - Manual dark mode classes */}
          <Card>
            <CardHeader>
              <CardTitle>❌ OLD Approach (Manual Classes)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Page Title */}
                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-bold text-neutral-900 dark:text-white/95">
                    膠囊生產營運中樞
                  </h1>
                  <p className="text-sm text-neutral-600 dark:text-white/75">
                    訂單管理、配方庫與 AI 助手一次整合
                  </p>
                </div>

                {/* Section Header */}
                <div className="flex items-center gap-2">
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent flex-1" />
                  <h2 className="text-sm font-semibold text-neutral-600 dark:text-white/75 uppercase tracking-wider">核心功能</h2>
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent flex-1" />
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 gap-4">
                  <Card className="bg-white dark:bg-elevation-1 border border-neutral-200 dark:border-white/10">
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <IconContainer icon={Plus} variant="primary" size="md" />
                        <div>
                          <h3 className="text-base font-semibold text-neutral-800 dark:text-white/95">建立訂單</h3>
                          <p className="text-sm text-neutral-600 dark:text-white/75">
                            建立新的膠囊生產訂單，設定原料比例、膠囊規格與生產數量。
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* NEW APPROACH - Unified Components */}
          <Card>
            <CardHeader>
              <CardTitle>✅ NEW Approach (Unified Components)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Page Title */}
                <div className="text-center space-y-2">
                  <Text.Primary as="h1" className="text-2xl font-bold">
                    膠囊生產營運中樞
                  </Text.Primary>
                  <Text.Secondary>
                    訂單管理、配方庫與 AI 助手一次整合
                  </Text.Secondary>
                </div>

                {/* Section Header */}
                <div className="flex items-center gap-2">
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent flex-1" />
                  <Text.Secondary as="h2" className="text-sm font-semibold uppercase tracking-wider">核心功能</Text.Secondary>
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent flex-1" />
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 gap-4">
                  <Container.Card>
                    <Container.Content>
                      <div className="flex items-center gap-3 mb-3">
                        <IconContainer icon={Plus} variant="primary" size="md" />
                        <div>
                          <Text.Primary as="h3" className="text-base font-semibold">建立訂單</Text.Primary>
                          <Text.Secondary>
                            建立新的膠囊生產訂單，設定原料比例、膠囊規格與生產數量。
                          </Text.Secondary>
                        </div>
                      </div>
                    </Container.Content>
                  </Container.Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <Container.Elevated className="p-6 mt-8">
          <Text.Primary as="h2" className="text-xl font-semibold mb-4">
            Refactoring Benefits
          </Text.Primary>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Text.Secondary as="h3" className="font-semibold mb-2">🎯 Single Source of Truth</Text.Secondary>
              <Text.Tertiary>Dark mode logic centralized in components, not scattered across pages</Text.Tertiary>
            </div>
            
            <div>
              <Text.Secondary as="h3" className="font-semibold mb-2">🔧 Easy Maintenance</Text.Secondary>
              <Text.Tertiary>Change dark mode in one place, affects all usage</Text.Tertiary>
            </div>
            
            <div>
              <Text.Secondary as="h3" className="font-semibold mb-2">🎨 Consistent Design</Text.Secondary>
              <Text.Tertiary>All text follows the same contrast and hierarchy rules</Text.Tertiary>
            </div>
            
            <div>
              <Text.Secondary as="h3" className="font-semibold mb-2">⚡ Developer Experience</Text.Secondary>
              <Text.Tertiary>No more manual dark: classes, just use the right component</Text.Tertiary>
            </div>
          </div>
        </Container.Elevated>

        {/* Code Comparison */}
        <Container.Section className="p-6 mt-8">
          <Text.Primary as="h2" className="text-xl font-semibold mb-4">
            Code Comparison
          </Text.Primary>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Text.Secondary as="h3" className="font-semibold mb-2">❌ Before (Manual Classes)</Text.Secondary>
              <div className="bg-neutral-100 dark:bg-elevation-2 p-4 rounded-lg">
                <pre className="text-xs text-neutral-700 dark:text-white/85">
{`<h1 className="text-2xl font-bold 
  text-neutral-900 dark:text-white/95">
  Title
</h1>
<p className="text-sm 
  text-neutral-600 dark:text-white/75">
  Description
</p>`}
                </pre>
              </div>
            </div>
            
            <div>
              <Text.Secondary as="h3" className="font-semibold mb-2">✅ After (Unified Components)</Text.Secondary>
              <div className="bg-neutral-100 dark:bg-elevation-2 p-4 rounded-lg">
                <pre className="text-xs text-neutral-700 dark:text-white/85">
{`<Text.Primary as="h1" 
  className="text-2xl font-bold">
  Title
</Text.Primary>
<Text.Secondary>
  Description
</Text.Secondary>`}
                </pre>
              </div>
            </div>
          </div>
        </Container.Section>
      </Container.Section>
    </Container.Page>
  )
}
