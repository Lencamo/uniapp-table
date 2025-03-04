import { ref, reactive, watch } from 'vue'

// 基础单元配置
export const unitConfig = reactive({
  buildingName: '某某测试楼栋',
  units: [
    { unitNo: 1, elevators: 2, roomCount: 5, totalFloors: 9 }, // 1单元 2梯5户 9层
    { unitNo: 2, elevators: 2, roomCount: 3, totalFloors: 7 } // 2单元 2梯3户 7层
  ]
})

// 生成楼盘数据的方法
export const generateBuildingData = (units) => {
  const maxFloor = Math.max(...units.map((u) => u.totalFloors))

  // 创建新的数据结构
  const newBuildingConfig = {
    buildingName: unitConfig.buildingName,
    maxFloor,
    floorRange: {
      high: { start: Math.floor((maxFloor * 2) / 3) + 1, end: maxFloor },
      middle: {
        start: Math.floor((maxFloor * 1) / 3) + 1,
        end: Math.floor((maxFloor * 2) / 3)
      },
      low: { start: 1, end: Math.floor((maxFloor * 1) / 3) }
    },
    units: units.map((unit) => ({
      ...unit,
      // 确保roomCount是数字类型
      roomCount: parseInt(unit.roomCount) || 4
    })),
    mergedRooms: {},
    elevatedRooms: {}
  }

  return newBuildingConfig
}

// 创建响应式状态管理
export const useBuildingStore = () => {
  const buildingConfig = reactive(generateBuildingData(unitConfig.units))

  // 监听单元配置变化
  watch(
    () => unitConfig.units,
    (newUnits) => {
      // 保存当前的合并和跃层状态
      const currentMergedRooms = { ...buildingConfig.mergedRooms }
      const currentElevatedRooms = { ...buildingConfig.elevatedRooms }

      // 重新生成基础数据
      const newBuildingConfig = generateBuildingData(newUnits)

      // 清空原有的合并和跃层信息
      buildingConfig.mergedRooms = {}
      buildingConfig.elevatedRooms = {}

      // 更新基础配置
      Object.assign(buildingConfig, newBuildingConfig)

      // 恢复有效的合并和跃层信息
      Object.entries(currentMergedRooms).forEach(([roomId, mergeInfo]) => {
        const [floor, unitNo, roomNo] = roomId.split('-').map(Number)
        const unit = newUnits.find((u) => u.unitNo === unitNo)
        // 检查房间号是否在新的户数范围内
        if (unit && floor <= unit.totalFloors && roomNo <= unit.roomCount) {
          buildingConfig.mergedRooms[roomId] = mergeInfo
        }
      })

      Object.entries(currentElevatedRooms).forEach(([roomId, elevateInfo]) => {
        const [floor, unitNo, roomNo] = roomId.split('-').map(Number)
        const unit = newUnits.find((u) => u.unitNo === unitNo)
        // 检查房间号是否在新的户数范围内
        if (unit && floor <= unit.totalFloors && roomNo <= unit.roomCount) {
          buildingConfig.elevatedRooms[roomId] = elevateInfo
        }
      })
    },
    { deep: true }
  )

  return {
    unitConfig,
    buildingConfig,
    updateUnitConfig: (newUnits) => {
      unitConfig.units = newUnits.map((unit) => ({
        ...unit,
        roomCount: parseInt(unit.roomCount) || 4
      }))
    },
    getBuildingData: () => ({
      unitConfig: unitConfig,
      buildingConfig: buildingConfig
    })
  }
}
