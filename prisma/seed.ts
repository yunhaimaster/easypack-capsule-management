import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('開始種子資料...')

  // 創建測試生產訂單
  const orders = [
    {
      customerName: '康健藥業股份有限公司',
      productName: '維生素C+D3鈣片',
      productionQuantity: 100000,
      completionDate: new Date('2024-01-15'),
      processIssues: '膠囊填充過程中發現部分膠囊重量偏差，已調整填充參數',
      qualityNotes: '品質檢驗合格，符合標準',
      capsuleColor: '白色',
      capsuleSize: '#0',
      capsuleType: '明膠胃溶',
      customerService: '張小姐',
      actualProductionQuantity: null,
      materialYieldQuantity: null,
      ingredients: [
        { materialName: '維生素C', unitContentMg: 500.0, isCustomerProvided: true, isCustomerSupplied: true },
        { materialName: '維生素D3', unitContentMg: 25.0, isCustomerProvided: true, isCustomerSupplied: true },
        { materialName: '鈣質', unitContentMg: 200.0, isCustomerProvided: true, isCustomerSupplied: false },
        { materialName: '賦形劑', unitContentMg: 75.0, isCustomerProvided: false, isCustomerSupplied: false }
      ]
    },
    {
      customerName: '永信藥品工業股份有限公司',
      productName: '益生菌膠囊',
      productionQuantity: 50000,
      completionDate: null,
      processIssues: null,
      qualityNotes: '待生產',
      capsuleColor: '透明',
      capsuleSize: '#1',
      capsuleType: '植物胃溶',
      customerService: '李小姐',
      actualProductionQuantity: null,
      materialYieldQuantity: null,
      ingredients: [
        { materialName: '魚油', unitContentMg: 1000.0, isCustomerProvided: true, isCustomerSupplied: true },
        { materialName: '維生素E', unitContentMg: 50.0, isCustomerProvided: true, isCustomerSupplied: false },
        { materialName: '明膠', unitContentMg: 150.0, isCustomerProvided: false, isCustomerSupplied: false }
      ]
    },
    {
      customerName: '中化製藥股份有限公司',
      productName: '葉酸鐵質複合膠囊',
      productionQuantity: 200000,
      completionDate: new Date('2024-01-20'),
      processIssues: '原料供應延遲，影響生產進度',
      qualityNotes: '已補貨完成，品質無虞',
      capsuleColor: '棕色',
      capsuleSize: '#0',
      capsuleType: '明膠腸溶',
      customerService: '王小姐',
      actualProductionQuantity: null,
      materialYieldQuantity: null,
      ingredients: [
        { materialName: '葉酸', unitContentMg: 400.0, isCustomerProvided: true, isCustomerSupplied: true },
        { materialName: '鐵質', unitContentMg: 18.0, isCustomerProvided: true, isCustomerSupplied: false },
        { materialName: '維生素B12', unitContentMg: 2.4, isCustomerProvided: true, isCustomerSupplied: false },
        { materialName: '澱粉', unitContentMg: 100.0, isCustomerProvided: false, isCustomerSupplied: false }
      ]
    },
    {
      customerName: '台灣東洋藥品工業股份有限公司',
      productName: '維生素B群膠囊',
      productionQuantity: 75000,
      completionDate: new Date('2024-01-18'),
      processIssues: null,
      qualityNotes: '生產順利，無異常',
      capsuleColor: '黃色',
      capsuleSize: '#00',
      capsuleType: '植物腸溶',
      customerService: '陳小姐',
      actualProductionQuantity: null,
      materialYieldQuantity: null,
      ingredients: [
        { materialName: '益生菌', unitContentMg: 50.0, isCustomerProvided: true, isCustomerSupplied: true },
        { materialName: '乳糖', unitContentMg: 200.0, isCustomerProvided: false, isCustomerSupplied: false },
        { materialName: '微晶纖維素', unitContentMg: 50.0, isCustomerProvided: false, isCustomerSupplied: false }
      ]
    },
    {
      customerName: '信東生技股份有限公司',
      productName: '綜合維生素膠囊',
      productionQuantity: 150000,
      completionDate: null,
      processIssues: '設備維護中，預計下週恢復生產',
      qualityNotes: '待設備維護完成',
      capsuleColor: '藍色',
      capsuleSize: '#1',
      capsuleType: '明膠胃溶',
      customerService: '林小姐',
      actualProductionQuantity: null,
      materialYieldQuantity: null,
      ingredients: [
        { materialName: '葡萄糖胺', unitContentMg: 750.0, isCustomerProvided: true, isCustomerSupplied: true },
        { materialName: '軟骨素', unitContentMg: 600.0, isCustomerProvided: true, isCustomerSupplied: false },
        { materialName: 'MSM', unitContentMg: 500.0, isCustomerProvided: true, isCustomerSupplied: false },
        { materialName: '賦形劑', unitContentMg: 150.0, isCustomerProvided: false, isCustomerSupplied: false }
      ]
    }
  ]

  for (const orderData of orders) {
    // 計算重量
    const unitWeightMg = orderData.ingredients.reduce(
      (sum, ingredient) => sum + ingredient.unitContentMg,
      0
    )
    const batchTotalWeightMg = unitWeightMg * orderData.productionQuantity

    const order = await prisma.productionOrder.create({
      data: {
        customerName: orderData.customerName,
        productName: orderData.productName,
        productionQuantity: orderData.productionQuantity,
        unitWeightMg,
        batchTotalWeightMg,
        completionDate: orderData.completionDate,
        processIssues: orderData.processIssues,
        qualityNotes: orderData.qualityNotes,
        capsuleColor: orderData.capsuleColor,
        capsuleSize: orderData.capsuleSize,
        capsuleType: orderData.capsuleType,
        customerService: orderData.customerService,
        actualProductionQuantity: orderData.actualProductionQuantity ?? null,
        materialYieldQuantity: orderData.materialYieldQuantity ?? null,
        ingredients: {
          create: orderData.ingredients.map(ingredient => ({
            materialName: ingredient.materialName,
            unitContentMg: ingredient.unitContentMg,
            isCustomerProvided: ingredient.isCustomerProvided ?? true,
            isCustomerSupplied: ingredient.isCustomerSupplied ?? true
          }))
        },
        worklogs: {
          create: []
        }
      }
    })

    console.log(`已創建訂單: ${order.productName} - ${order.customerName}`)
  }

  console.log('種子資料完成！')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
