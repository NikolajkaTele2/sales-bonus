/**
 * Функция для расчета прибыли
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
//    const { discount, sale_price, quantity } = purchase;
//    const discountedPrice = sale_price * (1 - discount / 100);
//    const profit = (discountedPrice - _product.purchase_price) * quantity;
    const discount =  1 - (purchase.discount / 100)
    
   return purchase.sale_price * purchase.quantity * discount 
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    if (index === 1) return 0.15;      
    if (index === 2 || index === 3) return 0.10;  
    if (index === total) return 0;     
    return 0.05;   
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    if (!data 
        || !Array.isArray(data.sellers) 
        || !Array.isArray(data.products) 
        || !Array.isArray(data.customers) 
        || !Array.isArray(data.purchase_records) 
        || data.sellers.length === 0
    ) {
        throw new Error('пустой массив');
    }

    const { calculateRevenue, calculateBonus } = options;

    if (!(typeof calculateRevenue === "function") || !(typeof calculateBonus === "function")) {
        throw new Error('не Функция');
    }

    const sellerStats = data.sellers.map(seller => ({
        seller_id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: [{
            sku: "",
            quantity: 0
        }]
    })); 

    const productIndex = Object.fromEntries(
        data.products.map(product => [product.sku, product])
    );

    const sellerIndex = sellerStats.reduce((result, seller) => ({
        ...result,
        [seller.seller_id]: seller
    }), {});

    data.purchase_records.forEach(record => { // Чек 
        const seller = sellerIndex[record.seller_id]; 
        
        seller.sales_count += 1;
        seller.revenue += record.total_amount;

        // Расчёт прибыли для каждого товара
        record.items.forEach(item => {
            const product = productIndex[item.sku]; 
            const cost = product.purchase_price * item.quantity;
            const revenue = calculateSimpleRevenue(item, product);
            const profit = revenue - cost;
            seller.profit += profit;

            // Учёт количества проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += 1;
            
        });
    });
    console.log(sellerStats)
}
/////////////////////////////////////////////////////////////////////////////////////////////////////
