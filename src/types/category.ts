export interface Category {
  id: string;
  name: string;
  description: string;
  parentId: string | null;
  children: Category[];
}