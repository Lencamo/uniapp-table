<template>
  <view class="building-table">
    <!-- 功能按钮区域 -->
    <view class="function-area">
      <button
        class="edit-btn"
        :disabled="!canEdit"
        :class="{ 'edit-btn-active': canEdit }"
        @click="handleEdit"
      >
        编辑
      </button>
    </view>

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
                :class="{ 'floor-selected': selectedFloor === floor }"
                @click="handleFloorClick(floor)"
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
                      :class="{
                        'column-selected':
                          selectedColumn === `${unit.unitNo}-${n}`,
                      }"
                      @click="handleColumnClick(unit.unitNo, n)"
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
                        'room-selected': isRoomSelected(room),
                        'floor-row-selected': isInSelectedFloor(room),
                        'column-selected': isInSelectedColumn(room),
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

  <!-- 使用抽离的编辑弹窗组件 -->
  <EditModal
    :show="showEditModal"
    :title="getEditTitle()"
    :selection-type="getSelectionType()"
    :details="getSelectionDetails()"
    @close="closeModal"
  />
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import EditModal from "./EditModal.vue";
import { generateBuildingData, mockUnits } from "./buildingData";

// 单元格宽度
const cellWidth = 120;

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

// 添加状态管理
const selectedRoom = ref(null);
const selectedFloor = ref(null);
const selectedColumn = ref(null);

// 清除所有选中状态
const clearAllSelections = () => {
  selectedRoom.value = null;
  selectedFloor.value = null;
  selectedColumn.value = null;
};

// 处理房间点击
const handleRoomClick = (room) => {
  if (room.isPlaceholder) return; // 占位符不可点击

  clearAllSelections(); // 清除之前的所有选中状态
  selectedRoom.value = room; // 设置新的选中状态
};

// 判断房间是否被选中
const isRoomSelected = (room) => {
  return selectedRoom.value?.id === room.id;
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

// 处理楼层点击
const handleFloorClick = (floor) => {
  clearAllSelections(); // 清除之前的所有选中状态
  selectedFloor.value = floor; // 设置新的选中状态
};

// 判断房间是否在选中的楼层
const isInSelectedFloor = (room) => {
  if (!selectedFloor.value) return false;
  if (room.isPlaceholder) {
    // 对于占位符，从id中获取楼层信息
    const floorFromId = parseInt(room.id.split("-")[0]);
    return floorFromId === selectedFloor.value;
  }
  // 对于正常房间，从房间号中提取完整的楼层号
  const floorFromRoomNo = parseInt(room.roomNo.slice(0, -2));
  return floorFromRoomNo === selectedFloor.value;
};

// 处理列表头点击
const handleColumnClick = (unitNo, roomIndex) => {
  clearAllSelections(); // 清除之前的所有选中状态
  selectedColumn.value = `${unitNo}-${roomIndex}`; // 设置新的选中状态
};

// 判断房间是否在选中的列
const isInSelectedColumn = (room) => {
  if (!selectedColumn.value) return false;
  const [selectedUnitNo, selectedRoomIndex] = selectedColumn.value
    .split("-")
    .map(Number);

  if (room.isPlaceholder) {
    // 对于占位符，从id中获取单元和房间索引信息
    const [_, unitNo, roomNo] = room.id.split("-").map(Number);
    return unitNo === selectedUnitNo && roomNo === selectedRoomIndex;
  }

  // 对于正常房间，判断单元号和房间号是否匹配
  return (
    room.unitNo === selectedUnitNo &&
    parseInt(room.roomNo.slice(-2)) === selectedRoomIndex
  );
};

// 控制编辑按钮状态和弹窗显示
const showEditModal = ref(false);

// 判断是否可以编辑（有选中内容时可编辑）
const canEdit = computed(() => {
  return selectedRoom.value || selectedFloor.value || selectedColumn.value;
});

// 处理编辑按钮点击
const handleEdit = () => {
  showEditModal.value = true;
};

// 关闭弹窗
const closeModal = () => {
  showEditModal.value = false;
};

// 获取编辑标题
const getEditTitle = () => {
  if (selectedRoom.value) return "编辑房间";
  if (selectedFloor.value) return "编辑整行";
  if (selectedColumn.value) return "编辑整列";
  return "编辑";
};

// 获取选中类型
const getSelectionType = () => {
  if (selectedRoom.value) return "单个房间";
  if (selectedFloor.value) return "整行";
  if (selectedColumn.value) return "整列";
  return "";
};

// 获取选中内容详情
const getSelectionDetails = () => {
  if (selectedRoom.value) {
    return `房间号：${selectedRoom.value.roomNo}\n面积：${selectedRoom.value.area}㎡\n单元：${selectedRoom.value.unitNo}单元`;
  }
  if (selectedFloor.value) {
    return `楼层：${selectedFloor.value}F\n该层所有房间`;
  }
  if (selectedColumn.value) {
    const [unitNo, roomIndex] = selectedColumn.value.split("-");
    return `单元：${unitNo}单元\n房间号：${roomIndex}室\n该列所有房间`;
  }
  return "";
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

/* 单个房间选中的样式 */
.room-cell.room-selected {
  position: relative;
  z-index: 2; /* 确保单个选中的房间在最上层 */
  background: #fffcf0;
}

.room-cell.room-selected::after {
  content: "";
  position: absolute;
  top: -1px;
  right: -1px;
  bottom: -1px;
  left: -1px;
  border: 2px solid #fde247;
  pointer-events: none;
  z-index: 2;
}

/* 整行选中的样式 */
.floor-no.floor-selected,
.room-cell.floor-row-selected {
  position: relative;
  z-index: 1;
  background: #fffcf0;
}

.floor-no.floor-selected::before,
.room-cell.floor-row-selected::before {
  content: "";
  position: absolute;
  top: -1px;
  right: -1px;
  bottom: -1px;
  left: -1px;
  border: 2px solid #fde247;
  pointer-events: none;
  z-index: 1;
}

/* 处理占位符样式 */
.room-cell.placeholder {
  cursor: not-allowed;
  color: #d9d9d9;
  background: #fafafa;
}

.room-cell.placeholder.floor-row-selected {
  background: #fafafa;
}

/* 移除之前的样式 */
.floor-no.floor-selected,
.room-cell.floor-row-selected {
  border-color: #eee;
  margin: 0;
}

/* 选中列的表头样式 */
.room-cell-header.column-selected {
  position: relative;
  z-index: 1;
  background: #fffcf0;
}

.room-cell-header.column-selected::before {
  content: "";
  position: absolute;
  top: -1px;
  right: -1px;
  bottom: -1px;
  left: -1px;
  border: 2px solid #fde247;
  pointer-events: none;
  z-index: 1;
}

/* 选中列中的房间样式 */
.room-cell.column-selected {
  position: relative;
  z-index: 1;
  background: #fffcf0;
}

.room-cell.column-selected::before {
  content: "";
  position: absolute;
  top: -1px;
  right: -1px;
  bottom: -1px;
  left: -1px;
  border: 2px solid #fde247;
  pointer-events: none;
  z-index: 1;
}

/* 处理占位符在选中列的样式 */
.room-cell.placeholder.column-selected {
  background: #fafafa;
}

/* 确保单个房间选中的优先级最高 */
.room-cell.room-selected {
  z-index: 3;
}

/* 确保行选中和列选中的优先级 */
.room-cell.floor-row-selected {
  z-index: 1;
}

.room-cell.column-selected {
  z-index: 2;
}

/* 单个房间选中时房间号加粗 */
.room-cell.room-selected .room-no {
  font-weight: bold;
}

/* 整行选中时房间号加粗 */
.room-cell.floor-row-selected .room-no {
  font-weight: bold;
}

/* 整列选中时房间号加粗 */
.room-cell.column-selected .room-no {
  font-weight: bold;
}

/* 表头列选中时加粗 */
/* 
.room-cell-header.column-selected {
  font-weight: bold;
} 
*/

/* 楼层号选中时加粗 */
/* 
.floor-no.floor-selected {
  font-weight: bold;
} 
  */

/* 确保占位符不加粗 */
.room-cell.placeholder .room-no {
  font-weight: normal !important;
}

/* 默认字体颜色 */
.room-row,
.floor-no,
.room-cell {
  color: #999999;
}

/* 单个房间选中时的字体样式 */
.room-cell.room-selected {
  color: #333333;
}

.room-cell.room-selected .room-no {
  font-weight: bold;
}

.room-cell.room-selected .room-area {
  color: #333333;
}

/* 整行选中时的字体样式 */
.floor-no.floor-selected {
  color: #333333;
}

.room-cell.floor-row-selected {
  color: #333333;
}

.room-cell.floor-row-selected .room-no {
  font-weight: bold;
}

.room-cell.floor-row-selected .room-area {
  color: #333333;
}

/* 整列选中时的字体样式 */
.room-cell-header.column-selected {
  color: #333333;
}

.room-cell.column-selected {
  color: #333333;
}

.room-cell.column-selected .room-no {
  font-weight: bold;
}

.room-cell.column-selected .room-area {
  color: #333333;
}

/* 确保占位符样式不变 */
.room-cell.placeholder {
  color: #d9d9d9 !important;
}

.room-cell.placeholder .room-no {
  font-weight: normal !important;
}

/* 功能区域样式 */
.function-area {
  padding: 20rpx;
  background: #fff;
  border-bottom: 1px solid #eee;
}

.edit-btn {
  width: 160rpx;
  height: 60rpx;
  line-height: 60rpx;
  font-size: 28rpx;
  color: #999;
  background: #f5f5f5;
  border: 1px solid #eee;
  border-radius: 4rpx;
}

.edit-btn-active {
  color: #333;
  background: #fff;
  border-color: #fde247;
}

.edit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
