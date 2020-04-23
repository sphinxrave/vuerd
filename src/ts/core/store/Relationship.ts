export interface RelationshipState {
  relationships: Relationship[];
}

export interface Relationship {
  id: string;
  identification: boolean;
  relationshipType: RelationshipType;
  start: RelationshipPoint;
  end: RelationshipPoint;
}

export interface RelationshipPoint {
  tableId: string;
  columnIds: string[];
  x: number;
  y: number;
  direction: Direction;
}

export enum RelationshipType {
  ZeroOne = "ZeroOne",
  // ZeroOneN = "ZeroOneN",
  ZeroN = "ZeroN",
  // One = "One",
  OneN = "OneN",
  OneOnly = "OneOnly",
  N = "N",
}

export enum Direction {
  left = "left",
  right = "right",
  top = "top",
  bottom = "bottom",
}

export function createRelationshipState(): RelationshipState {
  return {
    relationships: [],
  };
}