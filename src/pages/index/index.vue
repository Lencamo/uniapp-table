<template>
  <view class="building-table">
    <!-- 功能按钮区域 -->
    <view class="function-area">
      <view class="button-list">
        <button
          class="edit-btn"
          :disabled="!canEdit"
          :class="{ 'edit-btn-active': canEdit }"
          @click="handleEdit"
        >
          编辑
        </button>
        <view class="merge-buttons">
          <button
            class="merge-btn"
            :disabled="!canMerge"
            :class="{ 'merge-btn-active': canMerge }"
            @click="handleMergeClick"
          >
            合并
          </button>
          <button
            class="unmerge-btn"
            :disabled="!canUnmerge"
            :class="{ 'unmerge-btn-active': canUnmerge }"
            @click="handleUnmergeClick"
          >
            取消合并
          </button>
        </view>
        <button
          class="elevate-btn"
          :disabled="!canElevate"
          :class="{ 'elevate-btn-active': canElevate }"
          @click="handleElevateClick"
        >
          跃层
        </button>
      </view>
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
                        'grid-col-span-2': room.isMerged,
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
                      <text class="room-no">{{
                        getRoomDisplay(room).roomNo
                      }}</text>
                      <text v-if="!room.isPlaceholder" class="room-area">
                        {{ getRoomDisplay(room).area }}㎡
                      </text>
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
    :show-confirm="modalType === 'merge'"
    @close="closeModal"
    @confirm="handleMergeConfirm"
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
      for (let i = 0; i < unit.roomCount; i++) {
        const roomId = `${floor}-${unit.unitNo}-${i + 1}`;
        const mergeInfo = buildingConfig.mergedRooms[roomId];

        // 检查是否是被合并的房间
        const isMergedRoom = Object.values(buildingConfig.mergedRooms).some(
          (info) => info.mergedWithId === roomId
        );

        if (!isMergedRoom) {
          rooms.push({
            id: roomId,
            roomNo: generateRoomNo(floor, i + 1),
            area: 98,
            unitNo: unit.unitNo,
            isMerged: !!mergeInfo,
            mergeInfo,
          });
        }
      }
    } else {
      // 占位符逻辑保持不变
      for (let i = 0; i < unit.roomCount; i++) {
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

// 添加合并相关的状态
const lastSelectedRoom = ref(null);
const canMerge = computed(() => {
  if (!lastSelectedRoom.value || !selectedRoom.value) {
    console.log("未选择两个房间");
    return false;
  }

  if (lastSelectedRoom.value === selectedRoom.value) {
    console.log("选择了同一个房间");
    return false;
  }

  // 检查是否是同一行（同一楼层）
  const lastFloor = lastSelectedRoom.value.roomNo.slice(0, -2);
  const currentFloor = selectedRoom.value.roomNo.slice(0, -2);
  const isSameFloor = lastFloor === currentFloor;

  // 检查是否相邻
  const lastRoomIndex = parseInt(lastSelectedRoom.value.roomNo.slice(-2));
  const currentRoomIndex = parseInt(selectedRoom.value.roomNo.slice(-2));
  const isAdjacent = Math.abs(lastRoomIndex - currentRoomIndex) === 1;

  // 检查是否在同一单元
  const isSameUnit =
    lastSelectedRoom.value.unitNo === selectedRoom.value.unitNo;

  // 都不是占位符
  const notPlaceholder =
    !lastSelectedRoom.value.isPlaceholder && !selectedRoom.value.isPlaceholder;

  const canMerge = isSameFloor && isAdjacent && isSameUnit && notPlaceholder;
  console.log("最终结果:", {
    canMerge,
    lastRoom: lastSelectedRoom.value.roomNo,
    currentRoom: selectedRoom.value.roomNo,
  });

  return canMerge;
});

// 清除所有选中状态
const clearAllSelections = () => {
  selectedRoom.value = null;
  selectedFloor.value = null;
  selectedColumn.value = null;
  lastSelectedRoom.value = null;
};

// 判断两个房间是否相邻
const isAdjacent = (room1, room2) => {
  if (!room1 || !room2) return false;

  // 检查是否是同一行（同一楼层）
  const isSameFloor = room1.roomNo.slice(0, -2) === room2.roomNo.slice(0, -2);

  // 检查是否相邻
  const room1Index = parseInt(room1.roomNo.slice(-2));
  const room2Index = parseInt(room2.roomNo.slice(-2));
  const isNextTo = Math.abs(room1Index - room2Index) === 1;

  // 检查是否在同一单元
  const isSameUnit = room1.unitNo === room2.unitNo;

  // 都不是占位符
  const notPlaceholder = !room1.isPlaceholder && !room2.isPlaceholder;

  return isSameFloor && isNextTo && isSameUnit && notPlaceholder;
};

// 修改 isRoomSelected 方法
const isRoomSelected = (room) => {
  const isCurrentSelected = selectedRoom.value?.id === room.id;
  const isLastSelected = lastSelectedRoom.value?.id === room.id;

  // 只有在当前选中，或者是上一次选中且与当前选中的相邻时才高亮
  return (
    isCurrentSelected ||
    (isLastSelected && isAdjacent(lastSelectedRoom.value, selectedRoom.value))
  );
};

// 修改房间点击处理逻辑
const handleRoomClick = (room) => {
  if (room.isPlaceholder) return;

  // 如果已经有选中的房间
  if (selectedRoom.value) {
    // 如果点击的是同一个房间，清除所有选择
    if (selectedRoom.value.id === room.id) {
      selectedRoom.value = null;
      lastSelectedRoom.value = null;
      return;
    }

    // 更新上一次选中的房间
    lastSelectedRoom.value = selectedRoom.value;
  }

  // 清除其他选择状态（楼层和列）
  selectedFloor.value = null;
  selectedColumn.value = null;

  // 设置当前选中房间
  selectedRoom.value = room;

  // 如果新选中的房间与上一个选中的房间不相邻，清除上一次选中
  if (!isAdjacent(lastSelectedRoom.value, room)) {
    lastSelectedRoom.value = null;
  }
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
  if (room.isMerged) {
    return "span 2";
  }
  return "auto";
};

// 获取房间显示信息
const getRoomDisplay = (room) => {
  if (room.mergeInfo) {
    const mergedRoomId = room.mergeInfo.mergedWithId;
    const [mergedFloor, mergedUnit, mergedIndex] = mergedRoomId.split("-");
    const mergedRoomNo = generateRoomNo(
      parseInt(mergedFloor),
      parseInt(mergedIndex)
    );

    return {
      roomNo: `${room.roomNo}+${mergedRoomNo}`,
      area: room.mergeInfo.totalArea,
    };
  }

  return {
    roomNo: room.roomNo,
    area: room.area,
  };
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

// 修改判断房间是否在选中的列的方法
const isInSelectedColumn = (room) => {
  if (!selectedColumn.value) return false;
  const [selectedUnitNo, selectedRoomIndex] = selectedColumn.value
    .split("-")
    .map(Number);

  // 如果是占位符
  if (room.isPlaceholder) {
    const [_, unitNo, roomNo] = room.id.split("-").map(Number);
    return unitNo === selectedUnitNo && roomNo === selectedRoomIndex;
  }

  // 如果是合并的主房间，检查是否包含选中的列
  if (room.mergeInfo) {
    // 检查主房间是否在选中列
    const isMainRoomInColumn =
      room.unitNo === selectedUnitNo &&
      parseInt(room.roomNo.slice(-2)) === selectedRoomIndex;

    // 检查被合并的房间是否在选中列
    const [_, mergedUnitNo, mergedRoomIndex] = room.mergeInfo.mergedWithId
      .split("-")
      .map(Number);
    const isMergedRoomInColumn =
      mergedUnitNo === selectedUnitNo && mergedRoomIndex === selectedRoomIndex;

    return isMainRoomInColumn || isMergedRoomInColumn;
  }

  // 对于普通房间，判断单元号和房间号是否匹配
  return (
    room.unitNo === selectedUnitNo &&
    parseInt(room.roomNo.slice(-2)) === selectedRoomIndex
  );
};

// 控制编辑按钮状态和弹窗显示
const showEditModal = ref(false);

// 修改 canEdit 计算属性
const canEdit = computed(() => {
  // 如果有两个相邻房间被选中，也允许编辑
  if (lastSelectedRoom.value && selectedRoom.value) {
    return true; // 允许编辑两个相邻房间
  }

  // 原有的编辑条件
  return selectedRoom.value || selectedFloor.value || selectedColumn.value;
});

// 处理编辑按钮点击
const handleEdit = () => {
  if (!canEdit.value) return;

  modalType.value = "edit";
  showEditModal.value = true;
};

// 添加状态来控制显示内容
const modalType = ref("edit"); // 'edit' 或 'merge'
const mergeInfo = ref(null);

// 修改获取编辑标题的方法
const getEditTitle = () => {
  if (selectedRoom.value?.mergeInfo) {
    return "编辑合并房间";
  }

  if (lastSelectedRoom.value && selectedRoom.value) {
    return "编辑相邻房间";
  }

  if (selectedRoom.value) return "编辑房间";
  if (selectedFloor.value) return "编辑整行";
  if (selectedColumn.value) return "编辑整列";
  return "编辑";
};

// 修改获取选择类型的方法
const getSelectionType = () => {
  if (selectedRoom.value?.mergeInfo) {
    return "合并房间";
  }

  if (lastSelectedRoom.value && selectedRoom.value) {
    return "相邻房间";
  }

  if (selectedRoom.value) return "单个房间";
  if (selectedFloor.value) return "整行";
  if (selectedColumn.value) return "整列";
  return "";
};

// 修改获取详细信息的方法
const getSelectionDetails = () => {
  // 如果是合并后的房间
  if (selectedRoom.value?.mergeInfo) {
    const mergeInfo = selectedRoom.value.mergeInfo;
    const mergedRoomId = mergeInfo.mergedWithId;
    const [mergedFloor, mergedUnit, mergedIndex] = mergedRoomId.split("-");
    const mergedRoomNo = generateRoomNo(
      parseInt(mergedFloor),
      parseInt(mergedIndex)
    );

    return [
      `合并房间号：${selectedRoom.value.roomNo}+${mergedRoomNo}`,
      `总面积：${mergeInfo.totalArea}㎡`,
      `所在单元：${selectedRoom.value.unitNo}单元`,
      `所在楼层：${selectedRoom.value.roomNo.slice(0, -2)}层`,
      `包含房间：`,
      `  - ${selectedRoom.value.roomNo}（${selectedRoom.value.area}㎡）`,
      `  - ${mergedRoomNo}（${selectedRoom.value.area}㎡）`,
    ].join("\n");
  }

  // 如果是两个相邻房间
  if (lastSelectedRoom.value && selectedRoom.value) {
    return (
      `左侧房间：${lastSelectedRoom.value.roomNo} (${lastSelectedRoom.value.area}㎡)\n` +
      `右侧房间：${selectedRoom.value.roomNo} (${selectedRoom.value.area}㎡)`
    );
  }

  // 原有的详情逻辑
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

// 修改合并按钮点击处理
const handleMergeClick = () => {
  if (!canMerge.value) return;

  modalType.value = "merge";
  showEditModal.value = true;
};

// 修改关闭弹窗处理
const closeModal = () => {
  showEditModal.value = false;
  modalType.value = "edit"; // 重置为编辑模式
};

// 实现合并确认处理
const handleMergeConfirm = () => {
  if (!lastSelectedRoom.value || !selectedRoom.value) return;

  // 确保房间顺序是从左到右
  const [leftRoom, rightRoom] = [
    lastSelectedRoom.value,
    selectedRoom.value,
  ].sort((a, b) => parseInt(a.roomNo.slice(-2)) - parseInt(b.roomNo.slice(-2)));

  // 创建合并信息
  const mergeInfo = {
    mainRoomId: leftRoom.id,
    mergedWithId: rightRoom.id,
    totalArea: leftRoom.area + rightRoom.area,
  };

  // 更新合并状态
  buildingConfig.mergedRooms[leftRoom.id] = mergeInfo;

  // 清除选中状态
  clearAllSelections();

  // 设置合并后的主房间为选中状态
  selectedRoom.value = {
    ...leftRoom,
    isMerged: true,
    mergeInfo,
  };

  // 关闭弹窗
  closeModal();
};

// 添加取消合并按钮的状态控制
const canUnmerge = computed(() => {
  return selectedRoom.value?.mergeInfo;
});

// 处理取消合并按钮点击
const handleUnmergeClick = () => {
  if (!canUnmerge.value || !selectedRoom.value) return;

  const mergeInfo = selectedRoom.value.mergeInfo;

  // 从 mergedRooms 中删除合并信息
  delete buildingConfig.mergedRooms[selectedRoom.value.id];

  // 清除选中状态
  clearAllSelections();
};

// 添加跃层按钮的状态控制
const canElevate = computed(() => {
  // 暂时禁用状态，后续根据需求添加启用条件
  return false;
});

// 处理跃层按钮点击
const handleElevateClick = () => {
  if (!canElevate.value) return;
  // 跃层逻辑待实现
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

/* 按钮列表样式 */
.button-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

/* 合并按钮组样式 */
.merge-buttons {
  display: flex;
  justify-content: flex-start;
  gap: 20rpx;
}

/* 编辑按钮基础样式 */
.edit-btn,
.merge-btn,
.unmerge-btn,
.elevate-btn {
  height: 60rpx;
  line-height: 60rpx;
  font-size: 28rpx;
  color: #999;
  background: #f5f5f5;
  border: 1px solid #eee;
  border-radius: 4rpx;
}

/* 单独设置每个按钮的宽度 */
.edit-btn {
  width: 160rpx;
  align-self: flex-start;
}

.merge-btn {
  width: 160rpx;
}

.unmerge-btn {
  width: 200rpx;
}

.elevate-btn {
  width: 160rpx;
  align-self: flex-start;
}

/* 按钮激活状态 */
.edit-btn-active,
.merge-btn-active,
.unmerge-btn-active,
.elevate-btn-active {
  color: #333;
  background: #fff;
  border-color: #fde247;
}

/* 按钮禁用状态 */
.edit-btn:disabled,
.merge-btn:disabled,
.unmerge-btn:disabled,
.elevate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 合并房间样式 */
.room-cell.grid-col-span-2 {
  width: 300rpx;
}

/* 合并房间的边框样式 */
.room-cell.grid-col-span-2 {
  border-right: 1px solid #eee;
}
</style>
