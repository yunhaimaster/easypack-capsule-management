# EditRecipeDialog 调试指南

## 问题描述
用户点击"编辑配方"按钮后，Dialog 的 overlay（背景雾化）显示了，但弹窗内容不可见。

## 可能的原因

### 1. CSS 样式冲突 ✅ 已修复
**问题**: `liquid-glass-card` 类与 Dialog 的默认样式冲突
**修复**: 移除 `liquid-glass-card`，使用标准 Dialog 样式

### 2. z-index 问题
**检查**: Dialog 的 z-index 是否被其他元素覆盖
- DialogContent 默认 `z-50`
- 检查页面上是否有其他元素使用更高的 z-index

### 3. JavaScript 错误
**检查浏览器控制台**:
```
按 F12 打开开发者工具
查看 Console 标签是否有错误
```

### 4. Select 组件问题
**检查**: SelectContent 的 Portal 是否正常工作

## 调试步骤

### 步骤 1: 浏览器控制台检查
1. 打开配方详情页
2. 按 F12 打开开发者工具
3. 点击"编辑配方"按钮
4. 查看 Console 是否有红色错误信息

### 步骤 2: 检查 DOM 结构
在 Elements 标签中检查：
```html
<!-- 应该能看到这个结构 -->
<div data-state="open" class="fixed inset-0 z-50...">  <!-- Overlay -->
  <div role="dialog" class="fixed left-[50%] top-[50%] z-50...">  <!-- Content -->
    <div>
      <h2>编辑模板配方</h2>
      <form>...</form>
    </div>
  </div>
</div>
```

### 步骤 3: 检查样式覆盖
在 Elements 标签中选中 DialogContent，查看 Styles 面板：
- 检查 `display` 是否为 `none` 或 `hidden`
- 检查 `opacity` 是否为 `0`
- 检查 `transform` 是否将元素移出屏幕
- 检查 `z-index` 的值

### 步骤 4: 简化测试
临时修改代码，移除所有 Select 组件，只保留 Input 和 Textarea：

```tsx
// 临时简化版本
<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
  {/* 配方名称 */}
  <div className="space-y-2">
    <Label htmlFor="recipeName">配方名称 *</Label>
    <Input
      id="recipeName"
      {...register('recipeName')}
      placeholder="请输入配方名称"
    />
    {errors.recipeName && (
      <p className="text-sm text-red-600">{errors.recipeName.message}</p>
    )}
  </div>

  {/* 产品名称 */}
  <div className="space-y-2">
    <Label htmlFor="productName">产品名称 *</Label>
    <Input
      id="productName"
      {...register('productName')}
      placeholder="请输入产品名称"
    />
    {errors.productName && (
      <p className="text-sm text-red-600">{errors.productName.message}</p>
    )}
  </div>

  <DialogFooter>
    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
      取消
    </Button>
    <Button type="submit" disabled={saving}>
      {saving ? '保存中...' : '保存'}
    </Button>
  </DialogFooter>
</form>
```

## 已应用的修复

### 修复 1: 移除 liquid-glass-card
```tsx
// 之前（可能导致问题）
<DialogContent className="sm:max-w-xl liquid-glass-card">

// 修复后
<DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
```

### 修复 2: 添加最大高度和滚动
确保内容过长时可以滚动，不会超出屏幕

## 如果问题仍然存在

### 检查清单
- [ ] 浏览器控制台有没有错误？
- [ ] DialogContent 的 z-index 是多少？
- [ ] 能不能在 Elements 中看到 DialogContent 元素？
- [ ] DialogContent 的 display、opacity、transform 值是什么？
- [ ] 页面上有没有其他 fixed/absolute 元素遮挡？

### 终极测试：创建最简单的 Dialog
在 recipe-library/[id]/page.tsx 中添加测试按钮：

```tsx
// 添加到页面中
<Button
  onClick={() => {
    alert('测试开始')
    setEditRecipeOpen(true)
  }}
>
  测试编辑
</Button>

// 修改 EditRecipeDialog 为最简单版本
{recipe && (
  <Dialog open={editRecipeOpen} onOpenChange={setEditRecipeOpen}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>测试弹窗</DialogTitle>
      </DialogHeader>
      <div className="p-4 bg-red-500 text-white">
        如果你能看到这个红色方块，说明 Dialog 工作正常！
      </div>
      <DialogFooter>
        <Button onClick={() => setEditRecipeOpen(false)}>关闭</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)}
```

如果这个最简单的版本能显示，说明问题在 EditRecipeDialog 组件内部。

## 联系信息
如果以上步骤都无法解决，请提供：
1. 浏览器控制台的错误信息（截图）
2. Elements 标签中 DialogContent 的 HTML 结构（截图）
3. DialogContent 的 Computed styles（截图）

