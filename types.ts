export type data = {
  key: string;
  [key: string]: any;
};

export type callback = (res: any) => any;

export type browserDatabaseMethod = (data: data, callback: callback) => any;
