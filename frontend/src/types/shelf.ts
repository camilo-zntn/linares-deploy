export interface ILocker {
  _id?: string;
  number: number;
  status: 'available' | 'occupied';
  documents: string[];
}

export interface ICell {
  _id?: string;
  row: number;
  rowName: string;
  lockerCount: number;
  lockers?: Array<ILocker>;
}

export interface IShelf {
  _id: string;
  name: string;
  identifier: string;
  categoryId: {
    _id: string;
    name: string;
    letter: string;
  };
  categoryLetter: string;
  cells: ICell[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ISelectedDetails {
  estante: IShelf;
  cell: ICell;
  locker: ILocker;
}