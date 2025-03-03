// 房间类型定义
interface Room {
  id: string;
  roomNo: string;
  area: number;
  isMerged?: boolean;
  mergedWith?: string[];
  isElevated?: boolean;
  elevatedWith?: string[];
}

// 楼层类型定义
interface Floor {
  floorNo: number;
  rooms: Room[];
}

// 单元类型定义
interface Unit {
  unitNo: number;
  floors: Floor[];
}

// 楼盘配置类型
interface BuildingConfig {
  totalFloors: number;
  unitsPerFloor: number;
  roomsPerUnit: number;
  elevatorCount: number;
}
