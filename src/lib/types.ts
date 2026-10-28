export interface Picture { id:number; src:string; thumbnail:string; srcset:string; sizes:string; alt:string }
export interface Prices { price:string; regular_price:string; currency_code:string; currency_minor_unit:number }
export interface Category { id:number; name:string; slug:string; count:number; image:Picture|null }
export interface Product { id:number; name:string; slug:string; type:string; description:string; short_description:string; images:Picture[]; prices:Prices; is_in_stock:boolean; is_purchasable:boolean; categories:Category[]; attributes:{id:number; name:string; terms:{id:number; name:string; slug:string}[]}[]; variations:{id:number; attributes:{name:string;value:string}[]}[] }
export interface CartItem { key:string; id:number; name:string; quantity:number; images:Picture[]; prices:Prices; totals:{line_total:string;currency_code:string;currency_minor_unit:number}; quantity_limits:{minimum:number;maximum:number;editable:boolean} }
export interface Cart { items:CartItem[]; items_count:number; coupons:{code:string}[]; totals:{total_price:string;currency_code:string;currency_minor_unit:number}; errors:{message:string}[] }
