export interface TokenInfo {
  name: string;
  symbol: string;
  address: string;
  image: string;
  balance?: number;
}

export interface IModalRoot {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}
