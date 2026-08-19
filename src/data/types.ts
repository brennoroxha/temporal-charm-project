export interface LojaProduct {
  id: string;
  title: string;
  price: string;
  oldPrice?: string;
  img: string;
  slug: string;
  stock?: number;
  voltagem?: boolean;
}
