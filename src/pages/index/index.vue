<template>
  <view class="building-table">
    <!-- 垂直滚动容器 -->
    <scroll-view class="vertical-scroll" scroll-y>
      <view class="table-wrapper">
        <!-- 水平滚动容器 -->
        <scroll-view class="horizontal-scroll" scroll-x>
          <view class="table-grid">
            <!-- 左侧楼层列 -->
            <view class="floor-column">
              <view class="floor-no-header">
                <view class="header-text unit-text">单元</view>
                <view class="header-text floor-text">楼层</view>
              </view>
              <view
                class="floor-no"
                v-for="floor in floors"
                :key="floor"
                :data-floor-type="getFloorType(floor)"
              >
                {{ floor }}F
              </view>
            </view>

            <!-- 右侧内容区域 -->
            <view class="content-area">
              <!-- 表头 -->
              <view class="header-content">
                <!-- 楼栋号 -->
                <view class="building-row">
                  <text>{{ buildingConfig.buildingName }}</text>
                </view>
                <!-- 单元信息 -->
                <view class="unit-row">
                  <view
                    class="unit-cell"
                    v-for="unit in buildingConfig.units"
                    :key="unit.unitNo"
                    :style="{ width: `${unit.roomCount * 150}rpx` }"
                  >
                    {{ unit.unitNo }}单元({{ unit.roomCount }}户)
                  </view>
                </view>
                <!-- 房间号 -->
                <view
                  class="room-row"
                  :style="{ width: `${totalRoomCount * 150}rpx` }"
                >
                  <template
                    v-for="unit in buildingConfig.units"
                    :key="unit.unitNo"
                  >
                    <view
                      class="room-cell-header"
                      v-for="n in unit.roomCount"
                      :key="n"
                    >
                      {{ n }}室
                    </view>
                  </template>
                </view>
              </view>

              <!-- 房间内容区域改用Grid布局 -->
              <view class="rooms-container">
                <view
                  class="rooms-grid"
                  :style="{
                    gridTemplateColumns: `repeat(${totalRoomCount}, 150rpx)`,
                    gridTemplateRows: `repeat(${floors.length}, 150rpx)`,
                  }"
                >
                  <!-- 使用Grid布局，每个房间占据一个格子 -->
                  <template v-for="floor in floors" :key="floor">
                    <view
                      v-for="room in getFloorRooms(floor)"
                      :key="room.id"
                      class="room-cell"
                      :class="{
                        placeholder: room.isPlaceholder,
                        'grid-col-span-2': room.isMerged, // 水平合并示例
                        'grid-row-span-2': room.isVerticalMerged, // 垂直合并示例
                        highlight: room.isHighlighted, // 高亮示例
                      }"
                      :style="{
                        gridRow: `${buildingConfig.maxFloor - floor + 1}`,
                        gridColumn: getRoomGridPosition(room),
                      }"
                      @click="handleRoomClick(room)"
                    >
                      <text class="room-no">{{ room.roomNo }}</text>
                      <text v-if="!room.isPlaceholder" class="room-area"
                        >{{ room.area }}㎡</text
                      >
                    </view>
                  </template>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from "vue";

// 单元格宽度
const cellWidth = 120;

// 生成楼盘数据的方法
const generateBuildingData = (units) => {
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
const mockUnits = [
  { unitNo: 1, elevators: 2, roomsPerElevator: 2, totalFloors: 13 }, // 1单元 2梯2户 8层
  { unitNo: 2, elevators: 2, roomsPerElevator: 3, totalFloors: 10 }, // 2单元 2梯2户 6层
  { unitNo: 3, elevators: 2, roomsPerElevator: 2, totalFloors: 13 }, // 3单元 2梯2户 8层
  { unitNo: 4, elevators: 2, roomsPerElevator: 3, totalFloors: 10 }, // 4单元 2梯2户 6层
];

// 楼盘配置
const buildingConfig = reactive(generateBuildingData(mockUnits));

// 计算所有楼层（从高到低）
const floors = computed(() => {
  return Array.from(
    { length: buildingConfig.maxFloor },
    (_, i) => buildingConfig.maxFloor - i // 从最高楼层开始递减
  );
});

// 生成房间号
const generateRoomNo = (floor, roomNo) => {
  return `${floor}${String(roomNo).padStart(2, "0")}`;
};

// 获取指定楼层的所有房间
const getFloorRooms = (floor) => {
  const rooms = [];
  buildingConfig.units.forEach((unit) => {
    if (floor <= unit.totalFloors) {
      // 有楼层，添加房间
      for (let i = 0; i < unit.roomCount; i++) {
        // 从0开始计数
        rooms.push({
          id: `${floor}-${unit.unitNo}-${i + 1}`,
          roomNo: generateRoomNo(floor, i + 1),
          area: 98,
          unitNo: unit.unitNo,
          isMerged: false,
          isElevated: false,
        });
      }
    } else {
      // 没有楼层，添加占位符
      for (let i = 0; i < unit.roomCount; i++) {
        // 从0开始计数
        rooms.push({
          id: `${floor}-${unit.unitNo}-${i + 1}`,
          roomNo: "/",
          isPlaceholder: true,
          unitNo: unit.unitNo,
        });
      }
    }
  });
  return rooms;
};

// 获取楼层所属区域类型
const getFloorType = (floor) => {
  const { high, middle, low } = buildingConfig.floorRange;
  if (floor >= high.start && floor <= high.end) return "high";
  if (floor >= middle.start && floor <= middle.end) return "middle";
  if (floor >= low.start && floor <= low.end) return "low";
  return "";
};

// 处理房间点击
const handleRoomClick = (room) => {
  // 这里可以实现选中、合并等逻辑
  console.log("点击房间:", room);
};

// 处理内容区域滚动，同步表头滚动
const handleContentScroll = (e) => {
  const headerScroll = document.querySelector(".header-scroll");
  if (headerScroll) {
    headerScroll.scrollLeft = e.detail.scrollLeft;
  }
};

// 计算总房间数
const totalRoomCount = computed(() => {
  return buildingConfig.units.reduce((sum, unit) => sum + unit.roomCount, 0);
});

// 获取房间在网格中的位置
const getRoomGridPosition = (room) => {
  let position = 1;
  const unitIndex = room.unitNo - 1;
  const roomIndex = room.isPlaceholder
    ? parseInt(room.id.split("-")[2]) - 1
    : parseInt(room.roomNo.slice(-2)) - 1;

  // 计算当前单元之前的所有房间数
  for (let i = 0; i < unitIndex; i++) {
    position += buildingConfig.units[i].roomCount;
  }

  // 加上当前单元内的房间位置
  position += roomIndex;

  return position;
};
</script>

<style>
.building-table {
  padding: 20rpx;
  height: 100vh;
  box-sizing: border-box;
  background: #fff;
}

/* 调整滚动容器样式 */
.vertical-scroll {
  height: 100%;
}

.table-wrapper {
  height: fit-content;
  min-height: 100%;
}

.horizontal-scroll {
  width: 100%;
}

.table-grid {
  display: grid;
  grid-template-columns: 80rpx 1fr;
  min-width: fit-content;
  border-top: 1px solid #eee;
  border-left: 1px solid #eee;
}

/* 移除固定列样式，改为普通列样式 */
.floor-column {
  background: #fff;
  /* 移除 position: sticky 和 z-index */
}

/* 表头区域样式调整 */
.header-content {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 180rpx;
  box-sizing: border-box;
  width: fit-content; /* 确保宽度适应内容 */
}

/* 统一表头行高度 */
.building-row {
  height: 60rpx;
  padding: 0 20rpx;
  font-weight: bold;
  text-align: center;
  border-bottom: 1px solid #eee;
  box-sizing: border-box;
  background: #f5f5f5;
}

.unit-row {
  height: 60rpx;
  display: flex;
  border-bottom: 1px solid #eee;
  box-sizing: border-box;
  background: #f5f5f5;
  width: fit-content; /* 确保宽度适应内容 */
}

.room-row {
  height: 60rpx;
  display: flex;
  border-bottom: 1px solid #eee;
  box-sizing: border-box;
  background: #fff;
  width: fit-content; /* 默认宽度适应内容 */
}

/* 左侧楼层列表头 */
.floor-no-header {
  height: 180rpx; /* 3 * 60rpx */
  min-height: 180rpx;
  background: #f5f5f5;
  border-bottom: 1px solid #eee;
  border-right: 1px solid #eee;
  position: relative;
  box-sizing: border-box;
}

/* 对角线文字布局 */
.unit-text {
  position: absolute;
  right: 0rpx;
  top: 0rpx;
}

.floor-text {
  position: absolute;
  left: 0rpx;
  bottom: 0rpx;
}

/* 对角线 */
.floor-no-header::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to top right,
    transparent calc(50% - 1px),
    #eee calc(50% - 1px),
    #eee calc(50% + 1px),
    transparent calc(50% + 1px)
  );
}

.header-text {
  height: 60rpx;
  line-height: 60rpx;
  color: #333;
  font-weight: normal;
}

.floor-no {
  height: 150rpx;
  min-height: 150rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-bottom: 1px solid #eee;
  border-right: 1px solid #eee;
  box-sizing: border-box;
}

.unit-cell {
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #eee;
  box-sizing: border-box;
}

.room-cell-header {
  width: 150rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #eee;
  box-sizing: border-box;
  flex-shrink: 0; /* 防止单元格被压缩 */
}

/* 房间内容部分 */
.rooms-container {
  width: 100%;
  overflow: hidden;
}

.rooms-grid {
  display: grid;
  width: fit-content;
  gap: 0;
}

/* 房间单元格样式 */
.room-cell {
  width: 150rpx;
  height: 150rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #eee;
  border-bottom: 1px solid #eee;
  box-sizing: border-box;
  background: #fff;
}

.room-no {
  font-weight: normal;
}

/* 占位符样式，只改变文字颜色 */
.room-cell.placeholder {
  color: #d9d9d9;
}

/* 楼层区域标识优化 */
.floor-row[data-floor-type="high"] .floor-no {
  background: #f6ffed;
  border-right: 1px solid #e6f7ff;
}

.floor-row[data-floor-type="middle"] .floor-no {
  background: #fff7e6;
  border-right: 1px solid #ffe7ba;
}

.floor-row[data-floor-type="low"] .floor-no {
  background: #f5f5f5;
  border-right: 1px solid #eee;
}

.floor-row:last-child .floor-no,
.floor-row:last-child .room-cell {
  border-bottom: none;
}

/* 统一字体样式 */
.header-text,
.room-cell-header,
.floor-no,
.unit-cell,
.room-no,
.room-cell {
  font-size: 28rpx;
  font-weight: normal;
}

/* 房间面积样式 */
.room-area {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}

/* 确保最后一列没有右边框 */
.unit-cell:last-child,
.room-cell-header:last-child,
.room-cell:last-child {
  border-right: none;
}

/* 合并单元格样式 */
.grid-col-span-2 {
  grid-column: span 2;
}

.grid-row-span-2 {
  grid-row: span 2;
}

/* 高亮样式 */
.highlight {
  background: #e6f7ff;
}
</style>
