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
              <view class="floor-no-header"></view>
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
                  <text>{{ buildingConfig.buildingNo }}#</text>
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
                <view class="room-row">
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

              <!-- 房间内容 -->
              <view class="rooms-grid">
                <view class="floor-row" v-for="floor in floors" :key="floor">
                  <view
                    v-for="room in getFloorRooms(floor)"
                    :key="room.id"
                    class="room-cell"
                    :class="{
                      merged: room.isMerged,
                      elevated: room.isElevated,
                      placeholder: room.isPlaceholder,
                    }"
                    @click="handleRoomClick(room)"
                  >
                    <text class="room-no">{{ room.roomNo }}</text>
                    <text v-if="!room.isPlaceholder" class="room-area"
                      >{{ room.area }}㎡</text
                    >
                  </view>
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
    buildingNo: "1",
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
    (_, i) => buildingConfig.maxFloor - i
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
      for (let i = 1; i <= unit.roomCount; i++) {
        rooms.push({
          id: `${floor}-${unit.unitNo}-${i}`,
          roomNo: generateRoomNo(floor, i),
          area: 98,
          unitNo: unit.unitNo,
          isMerged: false,
          isElevated: false,
        });
      }
    } else {
      // 没有楼层，添加占位符
      for (let i = 1; i <= unit.roomCount; i++) {
        rooms.push({
          id: `${floor}-${unit.unitNo}-${i}`,
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
  border: 1px solid #eee;
}

/* 固定列样式调整 */
.floor-column {
  position: sticky;
  left: 0;
  z-index: 2;
  background: #fff;
}

/* 固定表头样式调整 */
.header-content {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #fff;
}

.floor-no-header {
  height: 180rpx; /* 等于表头三行的高度 */
  background: #f5f5f5;
  border-bottom: 1px solid #eee;
}

.floor-no {
  height: 150rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-bottom: 1px solid #eee;
}

.building-row {
  height: 60rpx;
  padding: 0 20rpx;
  font-weight: bold;
  border-bottom: 1px solid #eee;
}

.unit-row {
  height: 60rpx;
  display: flex;
  border-bottom: 1px solid #eee;
}

.unit-cell {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  border-right: 1px solid #eee;
}

.room-row {
  height: 60rpx;
  display: flex;
  border-bottom: 1px solid #eee;
}

.room-cell-header {
  width: 150rpx;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  border-right: 1px solid #eee;
}

/* 房间内容部分 */
.rooms-grid {
  flex: 1;
}

.floor-row {
  display: flex;
  border-bottom: 1px solid #eee;
}

.room-cell {
  width: 150rpx;
  height: 150rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #eee;
}

.room-no {
  font-size: 28rpx;
  font-weight: 500;
}

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

/* 占位符样式优化 */
.room-cell.placeholder {
  background: #fafafa;
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
</style>
