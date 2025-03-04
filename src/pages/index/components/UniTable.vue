<template>
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
              :class="{ 'floor-selected': isFloorSelected(floor) }"
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
              <view class="room-row" :style="{ width: `${totalRoomCount * 150}rpx` }">
                <template v-for="unit in buildingConfig.units" :key="unit.unitNo">
                  <view
                    class="room-cell-header"
                    v-for="n in unit.roomCount"
                    :key="n"
                    :class="{
                      'column-selected': selectedColumn === `${unit.unitNo}-${n}`
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
                  gridTemplateRows: `repeat(${floors.length}, 150rpx)`
                }"
              >
                <!-- 使用Grid布局，每个房间占据一个格子 -->
                <template v-for="floor in floors" :key="floor">
                  <view
                    v-for="room in getFloorRooms(floor)"
                    :key="room.id"
                    class="room-cell"
                    :class="{
                      'grid-col-span-2': room.mergeInfo,
                      'grid-row-span-2': room.elevateInfo,
                      'room-selected': isRoomSelected(room),
                      'floor-row-selected': isInSelectedFloor(room),
                      'column-selected': isInSelectedColumn(room)
                    }"
                    :style="{
                      gridRow: getRoomGridRow(room, floor),
                      gridColumn: getRoomGridPosition(room)
                    }"
                    @click="handleRoomClick(room)"
                  >
                    <text class="room-no">{{ getRoomDisplay(room).roomNo }}</text>
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
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  buildingConfig: {
    type: Object,
    required: true
  },
  selectedRoom: {
    type: Object,
    default: null
  },
  lastSelectedRoom: {
    type: Object,
    default: null
  },
  selectedFloor: {
    type: Number,
    default: null
  },
  lastSelectedFloor: {
    type: Number,
    default: null
  },
  selectedColumn: {
    type: String,
    default: null
  },
  mergedFloors: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['room-click', 'floor-click', 'column-click'])

// 计算所有楼层（从高到低）
const floors = computed(() => {
  return Array.from(
    { length: props.buildingConfig.maxFloor },
    (_, i) => props.buildingConfig.maxFloor - i
  )
})

// 计算总房间数
const totalRoomCount = computed(() => {
  return props.buildingConfig.units.reduce((sum, unit) => sum + unit.roomCount, 0)
})

// 生成房间号
const generateRoomNo = (floor, roomNo) => {
  return `${floor}${String(roomNo).padStart(2, '0')}`
}

// 获取指定楼层的所有房间
const getFloorRooms = (floor) => {
  const rooms = []
  props.buildingConfig.units.forEach((unit) => {
    if (floor <= unit.totalFloors) {
      for (let i = 0; i < unit.roomCount; i++) {
        const roomId = `${floor}-${unit.unitNo}-${i + 1}`
        const mergeInfo = props.buildingConfig.mergedRooms[roomId]
        const elevateInfo = props.buildingConfig.elevatedRooms[roomId]

        const isMergedRoom = Object.values(props.buildingConfig.mergedRooms).some(
          (info) => info.mergedWithId === roomId
        )

        const isElevatedRoom = Object.values(props.buildingConfig.elevatedRooms).some(
          (info) => info.mergedWithId === roomId
        )

        if (!isMergedRoom && !isElevatedRoom) {
          rooms.push({
            id: roomId,
            roomNo: generateRoomNo(floor, i + 1),
            area: 98,
            unitNo: unit.unitNo,
            isMerged: !!mergeInfo,
            mergeInfo,
            isElevated: !!elevateInfo,
            elevateInfo
          })
        }
      }
    } else {
      for (let i = 0; i < unit.roomCount; i++) {
        rooms.push({
          id: `${floor}-${unit.unitNo}-${i + 1}`,
          roomNo: '/',
          isPlaceholder: true,
          unitNo: unit.unitNo
        })
      }
    }
  })
  return rooms
}

// 获取楼层所属区域类型
const getFloorType = (floor) => {
  const { high, middle, low } = props.buildingConfig.floorRange
  if (floor >= high.start && floor <= high.end) return 'high'
  if (floor >= middle.start && floor <= middle.end) return 'middle'
  if (floor >= low.start && floor <= low.end) return 'low'
  return ''
}

// 判断房间是否被选中
const isRoomSelected = (room) => {
  const isCurrentSelected = props.selectedRoom?.id === room.id
  const isLastSelected = props.lastSelectedRoom?.id === room.id

  if (room.elevateInfo || (props.selectedRoom && props.selectedRoom.elevateInfo)) {
    return isCurrentSelected
  }

  return (
    isCurrentSelected || (isLastSelected && isAdjacent(props.lastSelectedRoom, props.selectedRoom))
  )
}

// 判断房间是否在选中的楼层中
const isInSelectedFloor = (room) => {
  if (!room) return false
  const roomFloor = parseInt(room.id.split('-')[0])

  const isElevatedFloor = Object.values(props.buildingConfig.elevatedRooms).some((info) => {
    const [mainFloor] = info.mainRoomId.split('-').map(Number)
    const [mergedFloor] = info.mergedWithId.split('-').map(Number)
    if (props.selectedFloor === mainFloor || props.selectedFloor === mergedFloor) {
      return roomFloor === mainFloor || roomFloor === mergedFloor
    }
    return false
  })

  if (isElevatedFloor) {
    return true
  }

  return roomFloor === props.selectedFloor || roomFloor === props.lastSelectedFloor
}

// 判断房间是否在选中的列中
const isInSelectedColumn = (room) => {
  if (!props.selectedColumn) return false
  const [selectedUnitNo, selectedRoomIndex] = props.selectedColumn.split('-').map(Number)

  if (room.isPlaceholder) {
    const [_, unitNo, roomNo] = room.id.split('-').map(Number)
    return unitNo === selectedUnitNo && roomNo === selectedRoomIndex
  }

  if (room.mergeInfo) {
    const isMainRoomInColumn =
      room.unitNo === selectedUnitNo && parseInt(room.roomNo.slice(-2)) === selectedRoomIndex

    const [_, mergedUnitNo, mergedRoomIndex] = room.mergeInfo.mergedWithId.split('-').map(Number)
    const isMergedRoomInColumn =
      mergedUnitNo === selectedUnitNo && mergedRoomIndex === selectedRoomIndex

    return isMainRoomInColumn || isMergedRoomInColumn
  }

  return room.unitNo === selectedUnitNo && parseInt(room.roomNo.slice(-2)) === selectedRoomIndex
}

// 判断楼层是否被选中
const isFloorSelected = (floor) => {
  if (props.selectedFloor || props.lastSelectedFloor) {
    if (props.mergedFloors[floor]) {
      return (
        floor === props.selectedFloor ||
        props.mergedFloors[floor] === props.selectedFloor ||
        floor === props.lastSelectedFloor ||
        props.mergedFloors[floor] === props.lastSelectedFloor
      )
    }

    const isCurrentFloorElevated = Object.values(props.buildingConfig.elevatedRooms).some(
      (info) => {
        const [mainFloor] = info.mainRoomId.split('-').map(Number)
        const [mergedFloor] = info.mergedWithId.split('-').map(Number)
        return floor === mainFloor || floor === mergedFloor
      }
    )

    if (isCurrentFloorElevated) {
      return floor === props.selectedFloor
    }

    return floor === props.selectedFloor || floor === props.lastSelectedFloor
  }

  return false
}

// 获取房间在网格中的位置
const getRoomGridPosition = (room) => {
  if (!room.mergeInfo) return 'auto'
  return 'span 2'
}

// 获取房间在网格中的行位置
const getRoomGridRow = (room, floor) => {
  const baseRow = props.buildingConfig.maxFloor - floor + 1
  if (room.elevateInfo) {
    return `${baseRow} / span 2`
  }
  return baseRow
}

// 获取房间显示信息
const getRoomDisplay = (room) => {
  if (room.isPlaceholder) {
    return {
      roomNo: '/',
      area: ''
    }
  }

  if (room.mergeInfo) {
    const mergedRoomId = room.mergeInfo.mergedWithId
    const [mergedFloor, mergedUnit, mergedIndex] = mergedRoomId.split('-')
    const mergedRoomNo = generateRoomNo(parseInt(mergedFloor), parseInt(mergedIndex))

    return {
      roomNo: `${room.roomNo}+${mergedRoomNo}`,
      area: room.mergeInfo.totalArea
    }
  }

  if (room.elevateInfo) {
    const mergedRoomId = room.elevateInfo.mergedWithId
    const [mergedFloor, mergedUnit, mergedIndex] = mergedRoomId.split('-')
    const mergedRoomNo = generateRoomNo(parseInt(mergedFloor), parseInt(mergedIndex))

    return {
      roomNo: `${room.roomNo}+${mergedRoomNo}`,
      area: room.elevateInfo.totalArea
    }
  }

  return {
    roomNo: room.roomNo,
    area: room.area
  }
}

// 事件处理函数
const handleRoomClick = (room) => {
  emit('room-click', room)
}

const handleFloorClick = (floor) => {
  emit('floor-click', floor)
}

const handleColumnClick = (unitNo, roomIndex) => {
  emit('column-click', unitNo, roomIndex)
}

// 判断两个房间是否相邻
const isAdjacent = (room1, room2) => {
  if (!room1 || !room2) return false

  const isSameFloor = room1.roomNo.slice(0, -2) === room2.roomNo.slice(0, -2)
  const room1Index = parseInt(room1.roomNo.slice(-2))
  const room2Index = parseInt(room2.roomNo.slice(-2))
  const isNextTo = Math.abs(room1Index - room2Index) === 1
  const isSameUnit = room1.unitNo === room2.unitNo
  const notPlaceholder = !room1.isPlaceholder && !room2.isPlaceholder

  return isSameFloor && isNextTo && isSameUnit && notPlaceholder
}
</script>

<style>
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

/* 表头区域样式调整 */
.header-content {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 180rpx;
  box-sizing: border-box;
  width: fit-content;
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
  width: fit-content;
}

.room-row {
  height: 60rpx;
  display: flex;
  border-bottom: 1px solid #eee;
  box-sizing: border-box;
  background: #fff;
  width: fit-content;
}

/* 左侧楼层列表头 */
.floor-no-header {
  height: 180rpx;
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
  content: '';
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
  flex-shrink: 0;
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

/* 占位符样式 */
.room-cell.placeholder {
  color: #d9d9d9;
  background: #fafafa;
}

/* 楼层区域标识 */
.floor-no[data-floor-type='high'] {
  background: #f6ffed;
  border-right: 1px solid #e6f7ff;
}

.floor-no[data-floor-type='middle'] {
  background: #fff7e6;
  border-right: 1px solid #ffe7ba;
}

.floor-no[data-floor-type='low'] {
  background: #f5f5f5;
  border-right: 1px solid #eee;
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

/* 默认字体颜色 */
.room-row,
.floor-no,
.room-cell {
  color: #999999;
}

/* 房间面积样式 */
.room-area {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}

/* 合并单元格样式 */
.grid-col-span-2 {
  grid-column: span 2;
  width: 300rpx;
}

.grid-row-span-2 {
  grid-row: span 2;
  height: 300rpx;
}

/* 选中样式 */
.room-cell.room-selected,
.floor-no.floor-selected,
.room-cell.floor-row-selected,
.room-cell-header.column-selected,
.room-cell.column-selected {
  position: relative;
  z-index: 1;
  background: #fffcf0;
  color: #333333;
}

.room-cell.room-selected::after,
.floor-no.floor-selected::before,
.room-cell.floor-row-selected::before,
.room-cell-header.column-selected::before,
.room-cell.column-selected::before {
  content: '';
  position: absolute;
  top: -1px;
  right: -1px;
  bottom: -1px;
  left: -1px;
  border: 1px solid #fde247;
  pointer-events: none;
  z-index: 1;
}

/* 选中时的字体加粗 */
.room-cell.room-selected .room-no,
.room-cell.floor-row-selected .room-no,
.room-cell.column-selected .room-no {
  font-weight: bold;
}

/* 选中时的面积文字颜色 */
.room-cell.room-selected .room-area,
.room-cell.floor-row-selected .room-area,
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

.room-cell.placeholder.floor-row-selected,
.room-cell.placeholder.column-selected {
  background: #fafafa;
}

/* z-index 层级控制 */
.room-cell.room-selected {
  z-index: 3;
}

.room-cell.column-selected {
  z-index: 2;
}

.room-cell.floor-row-selected {
  z-index: 1;
}

/* 垂直合并时的内容布局 */
.room-cell.grid-row-span-2 .room-no,
.room-cell.grid-row-span-2 .room-area {
  display: block;
  text-align: center;
}

.room-cell.grid-row-span-2 .room-area {
  margin-top: 20rpx;
}
</style>
