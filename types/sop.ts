// types/sop.ts

export interface ISop {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}