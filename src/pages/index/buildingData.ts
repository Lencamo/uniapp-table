// 生成楼盘数据的方法
export const generateBuildingData = (units: any[]) => {
  const maxFloor = Math.max(...units.map((u) => u.totalFloors));

  return {
    buildingName: "某某测试楼栋",
    maxFloor,
    floorRange: {
      high: { start: Math.floor((maxFloor * 2) / 3) + 1, end: maxFloor },
      middle: {
        start: Math.floor((maxFloor * 1) / 3) + 1,
        end: Math.floor((maxFloor * 2) / 3),
      },
      low: { start: 1, end: Math.floor((maxFloor * 1) / 3) },
    },
    units: units.map((unit) => ({
      ...unit, // 保留原始配置
      roomCount: unit.roomsPerElevator, // 每个单元的房间数就是每梯的户数
      rooms: Array.from({ length: unit.roomsPerElevator }, (_, i) => i + 1), // 生成房间号列表
    })),
  };
};

// 模拟数据
export const mockUnits = [
  { unitNo: 1, elevators: 2, roomsPerElevator: 2, totalFloors: 13 }, // 1单元 2梯2户 8层
  { unitNo: 2, elevators: 2, roomsPerElevator: 3, totalFloors: 10 }, // 2单元 2梯2户 6层
  { unitNo: 3, elevators: 2, roomsPerElevator: 2, totalFloors: 13 }, // 3单元 2梯2户 8层
  { unitNo: 4, elevators: 2, roomsPerElevator: 3, totalFloors: 10 }, // 4单元 2梯2户 6层
];
