/**
 * Функция для расчета прибыли
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
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
    if (index === 0) return 150;      
    if (index === 1 || index === 2) return 100;  
    if (index === total-1) return 0;     
    return 50;   
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
        || data.purchase_records.length === 0
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
        products_sold: {}
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
    sellerStats.sort((a, b) => b.profit - a.profit);

    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonusByProfit(index, sellerStats.length, seller) * seller.profit / 1000
        seller.top_products = Object.entries(seller.products_sold).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([sku, quantity]) => ({ sku, quantity }));;
        console.log(seller.top_products)
    });
    return sellerStats.map(seller => ({
        seller_id: seller.seller_id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
}));
    

}

