// src/constants/categories.js  (o .ts)
import RestaurantIcon        from '@mui/icons-material/Restaurant';
import BreakfastDiningIcon   from '@mui/icons-material/BreakfastDining';
import LunchDiningIcon       from '@mui/icons-material/LunchDining';
import SetMealIcon           from '@mui/icons-material/SetMeal';
import OutdoorGrillIcon      from '@mui/icons-material/OutdoorGrill';
import LocalPizzaIcon        from '@mui/icons-material/LocalPizza';
import FastfoodIcon          from '@mui/icons-material/Fastfood';
import RamenDiningIcon       from '@mui/icons-material/RamenDining';
import DinnerDiningIcon      from '@mui/icons-material/DinnerDining';   // «plato fuerte»
import FoodBankIcon          from '@mui/icons-material/FoodBank';
import SportsBarIcon         from '@mui/icons-material/SportsBar';
import LocalDrinkIcon        from '@mui/icons-material/LocalDrink';
import LocalCafeIcon         from '@mui/icons-material/LocalCafe';
import LocalBarIcon          from '@mui/icons-material/LocalBar';
import WineBarIcon           from '@mui/icons-material/WineBar';
import EmojiFoodBeverageIcon from '@mui/icons-material/EmojiFoodBeverage';
import LiquorIcon            from '@mui/icons-material/Liquor';
import CoffeeMakerIcon       from '@mui/icons-material/CoffeeMaker';

export const CATEGORIES = [
  /* --------- COMIDAS --------- */
  { id:  10, name:'Desayuno',            icon: BreakfastDiningIcon, order:  1, enabled: true },
  { id:  20, name:'Entradas',            icon: RestaurantIcon,      order:  2, enabled: true },
  { id:  25, name:'Ensaladas',           icon: RestaurantIcon,      order:  3, enabled: true },
  { id:  27, name:'Alitas de Pollo',     icon: SetMealIcon,         order:  4, enabled: true },
  { id:  40, name:'Hamburguesas',        icon: FastfoodIcon,        order:  5, enabled: true },
  { id: 120, name:'Tacos',               icon: LocalPizzaIcon,      order:  6, enabled: true },
  { id:  70, name:'Paninis',             icon: RamenDiningIcon,     order:  7, enabled: true },
  { id: 130, name:'Platos Principales',  icon: DinnerDiningIcon,    order:  8, enabled: true },
  { id:  42, name:'Barbacoas',           icon: OutdoorGrillIcon,    order:  9, enabled: true },
  { id:  60, name:'Cocina',              icon: LunchDiningIcon,     order: 10, enabled: true },
  { id:  90, name:'Combos',              icon: FoodBankIcon,        order: 11, enabled: true },

  /* --------- BEBIDAS SIN ALCOHOL --------- */
  { id:  15, name:'Bebidas',             icon: LocalDrinkIcon,      order: 20, enabled: true },
  { id:  95, name:'Jugos y Batidos',     icon: EmojiFoodBeverageIcon,order:21, enabled: true },
  { id:  96, name:'Naturales',           icon: CoffeeMakerIcon,     order: 22, enabled: true },
  { id: 110, name:'Refrescos',           icon: LocalDrinkIcon,      order: 23, enabled: true },

  /* --------- CERVEZAS Y BALDES --------- */
  { id:  30, name:'Baldes',              icon: SportsBarIcon,       order: 30, enabled: true },
  { id:  50, name:'Cervezas',            icon: SportsBarIcon,       order: 31, enabled: true },

  /* --------- VINOS / LICORES --------- */
  { id:  99, name:'Champagne',           icon: WineBarIcon,         order: 40, enabled: true },
  { id: 210, name:'Vinos',               icon: WineBarIcon,         order: 41, enabled: true },
  { id: 220, name:'Rones',               icon: LocalBarIcon,        order: 42, enabled: true },
  { id: 230, name:'Whiskys',             icon: LocalBarIcon,        order: 43, enabled: true },
  { id: 240, name:'Tequilas',            icon: LiquorIcon,          order: 44, enabled: true },
  { id: 250, name:'Vodkas',              icon: LiquorIcon,          order: 45, enabled: true },
  { id: 260, name:'Cocteles',            icon: LocalBarIcon,        order: 46, enabled: true },
  { id: 270, name:'Tragos',              icon: LocalBarIcon,        order: 47, enabled: true },

  /* --------- INTERNOS / NO MOSTRAR --------- */
  { id:   0, name:'Todos',               icon: RestaurantIcon,      order:  0, enabled: true },
  { id:   1, name:'Sin categorizar',     icon: RestaurantIcon,      order:999, enabled:false },
  { id: 141, name:'Ingredientes',        icon: RestaurantIcon,      order:999, enabled:false },
  { id: 201, name:'Productos Zona B',    icon: RestaurantIcon,      order:999, enabled:false },
  { id: 999, name:'Menu',                icon: RestaurantIcon,      order:999, enabled:false },
  { id: 555, name:'Regular',             icon: RestaurantIcon,      order:999, enabled:false },
];
