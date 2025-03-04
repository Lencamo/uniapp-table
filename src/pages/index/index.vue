<template>
  <div class="building-table">
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
        <view class="merge-buttons">
          <button
            class="elevate-btn"
            :disabled="!canElevate"
            :class="{ 'elevate-btn-active': canElevate }"
            @click="handleElevateClick"
          >
            跃层
          </button>
          <button
            class="unmerge-btn"
            :disabled="!canUnelevate"
            :class="{ 'unmerge-btn-active': canUnelevate }"
            @click="handleUnelevateClick"
          >
            取消跃层
          </button>
        </view>
      </view>
    </view>

    <!-- 使用新的UniTable组件 -->
    <UniTable
      :buildingConfig="buildingConfig"
      :selectedRoom="selectedRoom"
      :lastSelectedRoom="lastSelectedRoom"
      :selectedFloor="selectedFloor"
      :lastSelectedFloor="lastSelectedFloor"
      :selectedColumn="selectedColumn"
      :mergedFloors="mergedFloors"
      @room-click="handleRoomClick"
      @floor-click="handleFloorClick"
      @column-click="handleColumnClick"
    />

    <!-- 编辑弹窗组件 -->
    <EditModal
      :show="showEditModal"
      :title="getEditTitle()"
      :selection-type="getSelectionType()"
      :details="getSelectionDetails()"
      :show-confirm="!!modalType"
      @close="closeModal"
      @confirm="handleModalConfirm"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import EditModal from './components/EditModal.vue'
import UniTable from './components/UniTable.vue'
import { generateBuildingData, mockUnits } from './buildingData.js'

// 楼盘配置
const buildingConfig = reactive(generateBuildingData(mockUnits))

// 状态管理
const selectedRoom = ref(null)
const selectedFloor = ref(null)
const selectedColumn = ref(null)
const lastSelectedRoom = ref(null)
const lastSelectedFloor = ref(null)
const showEditModal = ref(false)
const mergedFloors = reactive({})

// 清除所有选中状态
const clearAllSelections = () => {
  selectedRoom.value = null
  selectedFloor.value = null
  selectedColumn.value = null
  lastSelectedRoom.value = null
  lastSelectedFloor.value = null
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

// 判断两个楼层是否相邻
const isAdjacentFloors = (floor1, floor2) => {
  if (!floor1 || !floor2) return false
  return Math.abs(floor1 - floor2) === 1
}

// 生成房间号
const generateRoomNo = (floor, roomNo) => {
  return `${floor}${String(roomNo).padStart(2, '0')}`
}

// 按钮状态控制
const canEdit = computed(() => {
  if (lastSelectedRoom.value && selectedRoom.value) {
    return true
  }
  return selectedRoom.value || selectedFloor.value || selectedColumn.value
})

const canMerge = computed(() => {
  if (!lastSelectedRoom.value || !selectedRoom.value) return false
  if (lastSelectedRoom.value === selectedRoom.value) return false
  if (lastSelectedRoom.value.elevateInfo || selectedRoom.value.elevateInfo) return false

  return isAdjacent(lastSelectedRoom.value, selectedRoom.value)
})

const canUnmerge = computed(() => {
  return selectedRoom.value?.mergeInfo
})

const canElevate = computed(() => {
  if (!lastSelectedFloor.value || !selectedFloor.value) return false

  const isAdjacent = isAdjacentFloors(lastSelectedFloor.value, selectedFloor.value)
  const isValidFloors = buildingConfig.units.some(
    (unit) => lastSelectedFloor.value <= unit.totalFloors && selectedFloor.value <= unit.totalFloors
  )

  const isAlreadyElevated = Object.values(buildingConfig.elevatedRooms).some((info) => {
    const [mainFloor] = info.mainRoomId.split('-').map(Number)
    const [mergedFloor] = info.mergedWithId.split('-').map(Number)
    return (
      lastSelectedFloor.value === mainFloor ||
      lastSelectedFloor.value === mergedFloor ||
      selectedFloor.value === mainFloor ||
      selectedFloor.value === mergedFloor
    )
  })

  return isAdjacent && isValidFloors && !isAlreadyElevated
})

const canUnelevate = computed(() => {
  if (selectedRoom.value) {
    return Object.values(buildingConfig.elevatedRooms).some((info) => {
      const roomId = selectedRoom.value.id
      return info.mainRoomId === roomId || info.mergedWithId === roomId
    })
  }

  if (selectedFloor.value) {
    return Object.values(buildingConfig.elevatedRooms).some((info) => {
      const [mainFloor] = info.mainRoomId.split('-').map(Number)
      const [mergedFloor] = info.mergedWithId.split('-').map(Number)
      return selectedFloor.value === mainFloor || selectedFloor.value === mergedFloor
    })
  }

  return false
})

// 事件处理
const handleRoomClick = (room) => {
  if (room.isPlaceholder) return

  if (selectedRoom.value) {
    if (selectedRoom.value.id === room.id) {
      selectedRoom.value = null
      lastSelectedRoom.value = null
      return
    }
    lastSelectedRoom.value = selectedRoom.value
  }

  selectedFloor.value = null
  selectedColumn.value = null
  lastSelectedFloor.value = null
  selectedColumn.value = null

  selectedRoom.value = room

  if (!isAdjacent(lastSelectedRoom.value, room)) {
    lastSelectedRoom.value = null
  }
}

const handleFloorClick = (floor) => {
  const isClickedFloorElevated = Object.values(buildingConfig.elevatedRooms).some((info) => {
    const [mainFloor] = info.mainRoomId.split('-').map(Number)
    const [mergedFloor] = info.mergedWithId.split('-').map(Number)
    return floor === mainFloor || floor === mergedFloor
  })

  if (selectedFloor.value) {
    if (selectedFloor.value === floor) {
      selectedFloor.value = null
      lastSelectedFloor.value = null
      return
    }

    const isSelectedFloorElevated = Object.values(buildingConfig.elevatedRooms).some((info) => {
      const [mainFloor] = info.mainRoomId.split('-').map(Number)
      const [mergedFloor] = info.mergedWithId.split('-').map(Number)
      return selectedFloor.value === mainFloor || selectedFloor.value === mergedFloor
    })

    if (isClickedFloorElevated || isSelectedFloorElevated) {
      selectedFloor.value = floor
      lastSelectedFloor.value = null
      return
    }

    lastSelectedFloor.value = selectedFloor.value
  }

  selectedRoom.value = null
  selectedColumn.value = null
  lastSelectedRoom.value = null

  selectedFloor.value = floor

  if (!isAdjacentFloors(lastSelectedFloor.value, floor)) {
    lastSelectedFloor.value = null
  }
}

const handleColumnClick = (unitNo, roomIndex) => {
  clearAllSelections()
  selectedColumn.value = `${unitNo}-${roomIndex}`
}

const handleEdit = () => {
  if (!canEdit.value) return
  modalType.value = 'edit'
  showEditModal.value = true
}

const handleMergeClick = () => {
  if (!canMerge.value) return
  modalType.value = 'merge'
  showEditModal.value = true
}

const handleUnmergeClick = () => {
  if (!canUnmerge.value || !selectedRoom.value) return

  if (selectedRoom.value.elevateInfo) {
    const [mainFloor] = selectedRoom.value.id.split('-').map(Number)
    const [mergedFloor] = selectedRoom.value.elevateInfo.mergedWithId.split('-').map(Number)
    delete mergedFloors[mainFloor]
    delete mergedFloors[mergedFloor]
  }

  delete buildingConfig.mergedRooms[selectedRoom.value.id]
  delete buildingConfig.elevatedRooms[selectedRoom.value.id]

  clearAllSelections()
}

const handleElevateClick = () => {
  if (!canElevate.value) return
  showEditModal.value = true
}

const handleUnelevateClick = () => {
  if (selectedRoom.value) {
    const elevatedInfo = Object.entries(buildingConfig.elevatedRooms).find(([roomId, info]) => {
      return (
        info.mainRoomId === selectedRoom.value.id || info.mergedWithId === selectedRoom.value.id
      )
    })

    if (elevatedInfo) {
      const [mainRoomId] = elevatedInfo
      delete buildingConfig.elevatedRooms[mainRoomId]
      const [mainFloor] = elevatedInfo[1].mainRoomId.split('-').map(Number)
      const [mergedFloor] = elevatedInfo[1].mergedWithId.split('-').map(Number)
      delete mergedFloors[mainFloor]
      delete mergedFloors[mergedFloor]
    }
  } else if (selectedFloor.value) {
    Object.entries(buildingConfig.elevatedRooms).forEach(([mainRoomId, info]) => {
      const [mainFloor] = info.mainRoomId.split('-').map(Number)
      const [mergedFloor] = info.mergedWithId.split('-').map(Number)
      if (selectedFloor.value === mainFloor || selectedFloor.value === mergedFloor) {
        delete buildingConfig.elevatedRooms[mainRoomId]
        delete mergedFloors[mainFloor]
        delete mergedFloors[mergedFloor]
      }
    })
  }

  clearAllSelections()
}

// 弹窗相关
const modalType = computed(() => {
  if (lastSelectedRoom.value && selectedRoom.value) {
    return 'merge'
  }
  if (lastSelectedFloor.value && selectedFloor.value) {
    return 'elevate'
  }
  return ''
})

const closeModal = () => {
  showEditModal.value = false
  modalType.value = 'edit'
}

const handleModalConfirm = () => {
  if (modalType.value === 'merge') {
    handleMergeConfirm()
  } else if (modalType.value === 'elevate') {
    handleElevateConfirm()
  }
}

const handleMergeConfirm = () => {
  if (!lastSelectedRoom.value || !selectedRoom.value) return

  const [leftRoom, rightRoom] = [lastSelectedRoom.value, selectedRoom.value].sort(
    (a, b) => parseInt(a.roomNo.slice(-2)) - parseInt(b.roomNo.slice(-2))
  )

  const mergeInfo = {
    mainRoomId: leftRoom.id,
    mergedWithId: rightRoom.id,
    totalArea: leftRoom.area + rightRoom.area
  }

  buildingConfig.mergedRooms[leftRoom.id] = mergeInfo

  clearAllSelections()

  selectedRoom.value = {
    ...leftRoom,
    isMerged: true,
    mergeInfo
  }

  closeModal()
}

const handleElevateConfirm = () => {
  if (!lastSelectedFloor.value || !selectedFloor.value) return

  const [lowerFloor, upperFloor] = [lastSelectedFloor.value, selectedFloor.value].sort(
    (a, b) => a - b
  )

  const lowerRooms = getFloorRooms(lowerFloor).filter((r) => !r.isPlaceholder)
  const upperRooms = getFloorRooms(upperFloor).filter((r) => !r.isPlaceholder)

  upperRooms.forEach((upperRoom, index) => {
    const lowerRoom = lowerRooms[index]
    if (lowerRoom) {
      const elevateInfo = {
        mainRoomId: upperRoom.id,
        mergedWithId: lowerRoom.id,
        totalArea: upperRoom.area + lowerRoom.area
      }

      buildingConfig.elevatedRooms[upperRoom.id] = elevateInfo
      mergedFloors[upperFloor] = lowerFloor
      mergedFloors[lowerFloor] = upperFloor
    }
  })

  clearAllSelections()
  selectedFloor.value = upperFloor
  closeModal()
}

// 获取弹窗信息
const getEditTitle = () => {
  if (selectedRoom.value?.mergeInfo) return '编辑合并房间'
  if (lastSelectedRoom.value && selectedRoom.value) return '编辑相邻房间'
  if (lastSelectedFloor.value && selectedFloor.value) return '编辑相邻楼层'
  if (selectedRoom.value) return '编辑房间'
  if (selectedFloor.value) return '编辑整行'
  if (selectedColumn.value) return '编辑整列'
  return '编辑'
}

const getSelectionType = () => {
  if (selectedRoom.value?.mergeInfo) return '合并房间'
  if (lastSelectedRoom.value && selectedRoom.value) return '相邻房间'
  if (lastSelectedFloor.value && selectedFloor.value) return '相邻楼层'
  if (selectedRoom.value) return '单个房间'
  if (selectedFloor.value) return '整行'
  if (selectedColumn.value) return '整列'
  return ''
}

const getSelectionDetails = () => {
  if (selectedRoom.value?.elevateInfo) {
    const mainRoom = selectedRoom.value
    const mergedRoomId = mainRoom.elevateInfo.mergedWithId
    const [mergedFloor, mergedUnit, mergedIndex] = mergedRoomId.split('-')
    const mergedRoomNo = generateRoomNo(parseInt(mergedFloor), parseInt(mergedIndex))

    return [
      `合并房间号：${mainRoom.roomNo}+${mergedRoomNo}`,
      `总面积：${mainRoom.elevateInfo.totalArea}㎡`,
      `所在单元：${mainRoom.unitNo}单元`,
      `所在楼层：${mainRoom.roomNo.slice(0, -2)}层 - ${mergedFloor}层`,
      `包含房间：`,
      `  - ${mainRoom.roomNo}（${mainRoom.area}㎡）`,
      `  - ${mergedRoomNo}（${mainRoom.area}㎡）`
    ].join('\n')
  }

  if (selectedRoom.value?.mergeInfo) {
    const mergeInfo = selectedRoom.value.mergeInfo
    const mergedRoomId = mergeInfo.mergedWithId
    const [mergedFloor, mergedUnit, mergedIndex] = mergedRoomId.split('-')
    const mergedRoomNo = generateRoomNo(parseInt(mergedFloor), parseInt(mergedIndex))

    return [
      `合并房间号：${selectedRoom.value.roomNo}+${mergedRoomNo}`,
      `总面积：${mergeInfo.totalArea}㎡`,
      `所在单元：${selectedRoom.value.unitNo}单元`,
      `所在楼层：${selectedRoom.value.roomNo.slice(0, -2)}层`,
      `包含房间：`,
      `  - ${selectedRoom.value.roomNo}（${selectedRoom.value.area}㎡）`,
      `  - ${mergedRoomNo}（${selectedRoom.value.area}㎡）`
    ].join('\n')
  }

  if (lastSelectedRoom.value && selectedRoom.value) {
    return (
      `左侧房间：${lastSelectedRoom.value.roomNo} (${lastSelectedRoom.value.area}㎡)\n` +
      `右侧房间：${selectedRoom.value.roomNo} (${selectedRoom.value.area}㎡)`
    )
  }

  if (lastSelectedFloor.value && selectedFloor.value) {
    const [lowerFloor, upperFloor] = [lastSelectedFloor.value, selectedFloor.value].sort(
      (a, b) => a - b
    )

    const lowerFloorRooms = getFloorRooms(lowerFloor).filter((r) => !r.isPlaceholder)
    const upperFloorRooms = getFloorRooms(upperFloor).filter((r) => !r.isPlaceholder)

    const formatRooms = (rooms) => {
      const result = []
      for (let i = 0; i < rooms.length; i += 2) {
        const room1 = `${rooms[i].roomNo}（${rooms[i].area}㎡）`
        const room2 = rooms[i + 1] ? `${rooms[i + 1].roomNo}（${rooms[i + 1].area}㎡）` : ''
        result.push(`  ${room1}${room2 ? `    ${room2}` : ''}`)
      }
      return result
    }

    return [
      `选中楼层：${lowerFloor}F - ${upperFloor}F`,
      `\n${lowerFloor}F 房间：`,
      ...formatRooms(lowerFloorRooms),
      `\n${upperFloor}F 房间：`,
      ...formatRooms(upperFloorRooms),
      `\n可进行跃层操作`
    ].join('\n')
  }

  if (selectedRoom.value) {
    return `房间号：${selectedRoom.value.roomNo}\n面积：${selectedRoom.value.area}㎡\n单元：${selectedRoom.value.unitNo}单元`
  }
  if (selectedFloor.value) {
    return `楼层：${selectedFloor.value}F\n该层所有房间`
  }
  if (selectedColumn.value) {
    const [unitNo, roomIndex] = selectedColumn.value.split('-')
    return `单元：${unitNo}单元\n房间号：${roomIndex}室\n该列所有房间`
  }
  return ''
}

// 辅助方法
const getFloorRooms = (floor) => {
  const rooms = []
  buildingConfig.units.forEach((unit) => {
    if (floor <= unit.totalFloors) {
      for (let i = 0; i < unit.roomCount; i++) {
        const roomId = `${floor}-${unit.unitNo}-${i + 1}`
        const mergeInfo = buildingConfig.mergedRooms[roomId]
        const elevateInfo = buildingConfig.elevatedRooms[roomId]

        const isMergedRoom = Object.values(buildingConfig.mergedRooms).some(
          (info) => info.mergedWithId === roomId
        )

        const isElevatedRoom = Object.values(buildingConfig.elevatedRooms).some(
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
</script>

<style>
.building-table {
  padding: 20rpx;
  height: 100vh;
  box-sizing: border-box;
  background: #fff;
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
.elevate-btn,
.unelevate-btn {
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
.elevate-btn-active,
.unelevate-btn-active {
  color: #333;
  background: #fff;
  border-color: #fde247;
}

/* 按钮禁用状态 */
.edit-btn:disabled,
.merge-btn:disabled,
.unmerge-btn:disabled,
.elevate-btn:disabled,
.unelevate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
