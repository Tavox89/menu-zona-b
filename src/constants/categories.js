import {
  Restaurant as RestaurantIcon,
  BreakfastDining as BreakfastIcon,
  LunchDining as LunchIcon,
  SetMeal as WingsIcon,
  Grill as GrillIcon,
  LocalPizza as TacoIcon,
  Fastfood as BurgerIcon,
  RamenDining as PaniniIcon,
  Dining as MainDishIcon,
  FoodBank as ComboIcon,
  SportsBar as BucketIcon,
  LocalDrink as DrinkIcon,
  LocalCafe as CoffeeIcon,
  LocalBar as SpiritIcon,
  Beer as BeerIcon,
  WineBar as WineIcon,
  EmojiFoodBeverage as JuiceIcon,
  Liquor as LiquorIcon,
  CoffeeMaker as NaturalIcon,
} from '@mui/icons-material';

export const CATEGORIES = [
  /* --------- COMIDAS --------- */
  { id: 10, name: 'Desayuno', icon: BreakfastIcon, order: 1, enabled: true },
  { id: 20, name: 'Entradas', icon: RestaurantIcon, order: 2, enabled: true },
  { id: 25, name: 'Ensaladas', icon: RestaurantIcon, order: 3, enabled: true },
  { id: 27, name: 'Alitas de Pollo', icon: WingsIcon, order: 4, enabled: true },
  { id: 40, name: 'Hamburguesas', icon: BurgerIcon, order: 5, enabled: true },
  { id: 120, name: 'Tacos', icon: TacoIcon, order: 6, enabled: true },
  { id: 70, name: 'Paninis', icon: PaniniIcon, order: 7, enabled: true },
  { id: 130, name: 'Platos Principales', icon: MainDishIcon, order: 8, enabled: true },
  { id: 42, name: 'Barbacoas', icon: GrillIcon, order: 9, enabled: true },
  { id: 60, name: 'Cocina', icon: LunchIcon, order: 10, enabled: true },
  { id: 90, name: 'Combos', icon: ComboIcon, order: 11, enabled: true },

  /* --------- BEBIDAS SIN ALCOHOL --------- */
  { id: 15, name: 'Bebidas', icon: DrinkIcon, order: 20, enabled: true },
  { id: 95, name: 'Jugos y Batidos', icon: JuiceIcon, order: 21, enabled: true },
  { id: 96, name: 'Naturales', icon: NaturalIcon, order: 22, enabled: true },
  { id: 110, name: 'Refrescos', icon: DrinkIcon, order: 23, enabled: true },

  /* --------- CERVEZAS Y BALDES --------- */
  { id: 30, name: 'Baldes', icon: BucketIcon, order: 30, enabled: true },
  { id: 50, name: 'Cervezas', icon: BeerIcon, order: 31, enabled: true },

  /* --------- VINOS / LICORES --------- */
  { id: 99, name: 'Champagne', icon: WineIcon, order: 40, enabled: true },
  { id: 210, name: 'Vinos', icon: WineIcon, order: 41, enabled: true },
  { id: 220, name: 'Rones', icon: SpiritIcon, order: 42, enabled: true },
  { id: 230, name: 'Whiskys', icon: SpiritIcon, order: 43, enabled: true },
  { id: 240, name: 'Tequilas', icon: LiquorIcon, order: 44, enabled: true },
  { id: 250, name: 'Vodkas', icon: LiquorIcon, order: 45, enabled: true },
  { id: 260, name: 'Cocteles', icon: SpiritIcon, order: 46, enabled: true },
  { id: 270, name: 'Tragos', icon: SpiritIcon, order: 47, enabled: true },

  /* --------- INTERNOS / NO MOSTRAR --------- */
  { id: 0, name: 'Todos', icon: RestaurantIcon, order: 0, enabled: true },
  { id: 1, name: 'Sin categorizar', icon: RestaurantIcon, order: 999, enabled: false },
  { id: 141, name: 'Ingredientes', icon: RestaurantIcon, order: 999, enabled: false },
  { id: 201, name: 'Productos Zona B', icon: RestaurantIcon, order: 999, enabled: false },
  { id: 999, name: 'Menu', icon: RestaurantIcon, order: 999, enabled: false },
  { id: 555, name: 'Regular', icon: RestaurantIcon, order: 999, enabled: false },
];