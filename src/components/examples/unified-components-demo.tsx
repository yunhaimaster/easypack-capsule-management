'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Text } from '@/components/ui/text'
import { Container } from '@/components/ui/container'
import { TableComponents } from '@/components/ui/table-unified'

/**
 * Demo showing the difference between OLD and NEW approaches
 * This demonstrates the unified component architecture
 */

export function UnifiedComponentsDemo() {
  return (
    <Container.Page>
      <Container.Section className="p-8">
        <Text.Primary as="h1" className="text-3xl font-bold mb-8">
          Unified Components Demo
        </Text.Primary>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* OLD APPROACH (Anti-pattern) */}
          <Card>
            <CardHeader>
              <CardTitle>❌ OLD Approach (Anti-pattern)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-800 dark:text-white/95 mb-2">
                    Manual Dark Mode Classes
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-white/75">
                    Every text element needs manual dark: classes
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-white/65">
                    This creates maintenance issues and inconsistency
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-neutral-100 dark:bg-elevation-2 text-neutral-700 dark:text-white/85 rounded text-xs">
                    Manual Badge
                  </span>
                  <span className="px-2 py-1 bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400 rounded text-xs">
                    Status Badge
                  </span>
                </div>

                <Button variant="outline" className="w-full">
                  Manual Button Styling
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* NEW APPROACH (Correct) */}
          <Card>
            <CardHeader>
              <CardTitle>✅ NEW Approach (Correct)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Text.Primary as="h3" className="text-lg font-semibold mb-2">
                    Unified Text Components
                  </Text.Primary>
                  <Text.Secondary>
                    Components handle their own dark mode internally
                  </Text.Secondary>
                  <Text.Tertiary>
                    No manual dark: classes needed
                  </Text.Tertiary>
                </div>
                
                <div className="flex gap-2">
                  <Badge variant="neutral">Unified Badge</Badge>
                  <Badge variant="success">Status Badge</Badge>
                </div>

                <Button variant="outline" className="w-full">
                  Unified Button (no manual classes)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table Example */}
        <div className="mt-8">
          <Text.Primary as="h2" className="text-xl font-semibold mb-4">
            Unified Table Component
          </Text.Primary>
          
          <TableComponents.Table>
            <TableComponents.Header>
              <TableComponents.Row>
                <TableComponents.Head>Name</TableComponents.Head>
                <TableComponents.Head>Status</TableComponents.Head>
                <TableComponents.Head>Date</TableComponents.Head>
                <TableComponents.Head>Actions</TableComponents.Head>
              </TableComponents.Row>
            </TableComponents.Header>
            <TableComponents.Body>
              <TableComponents.Row interactive>
                <TableComponents.Cell variant="primary">John Doe</TableComponents.Cell>
                <TableComponents.Cell variant="secondary">
                  <Badge variant="success">Active</Badge>
                </TableComponents.Cell>
                <TableComponents.Cell variant="tertiary">2025-01-23</TableComponents.Cell>
                <TableComponents.Cell variant="muted">
                  <Button size="sm" variant="outline">Edit</Button>
                </TableComponents.Cell>
              </TableComponents.Row>
              <TableComponents.Row interactive>
                <TableComponents.Cell variant="primary">Jane Smith</TableComponents.Cell>
                <TableComponents.Cell variant="secondary">
                  <Badge variant="warning">Pending</Badge>
                </TableComponents.Cell>
                <TableComponents.Cell variant="tertiary">2025-01-22</TableComponents.Cell>
                <TableComponents.Cell variant="muted">
                  <Button size="sm" variant="outline">Edit</Button>
                </TableComponents.Cell>
              </TableComponents.Row>
            </TableComponents.Body>
          </TableComponents.Table>
        </div>

        {/* Benefits Section */}
        <Container.Elevated className="p-6 mt-8">
          <Text.Primary as="h2" className="text-xl font-semibold mb-4">
            Benefits of Unified Components
          </Text.Primary>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Text.Secondary as="h3" className="font-semibold mb-2">✅ Single Source of Truth</Text.Secondary>
              <Text.Tertiary>Dark mode logic in one place, not scattered across pages</Text.Tertiary>
            </div>
            
            <div>
              <Text.Secondary as="h3" className="font-semibold mb-2">✅ Consistency</Text.Secondary>
              <Text.Tertiary>All components follow the same dark mode patterns</Text.Tertiary>
            </div>
            
            <div>
              <Text.Secondary as="h3" className="font-semibold mb-2">✅ Maintainability</Text.Secondary>
              <Text.Tertiary>Change dark mode in component, not everywhere</Text.Tertiary>
            </div>
            
            <div>
              <Text.Secondary as="h3" className="font-semibold mb-2">✅ Reusability</Text.Secondary>
              <Text.Tertiary>Components work anywhere without modification</Text.Tertiary>
            </div>
          </div>
        </Container.Elevated>
      </Container.Section>
    </Container.Page>
  )
}
