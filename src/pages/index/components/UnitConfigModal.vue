<template>
  <view v-if="show" class="unit-config-modal">
    <view class="modal-mask" @click="handleClose"></view>
    <view class="modal-content">
      <view class="modal-header">
        <text class="modal-title">单元配置</text>
        <text class="modal-close" @click="handleClose">×</text>
      </view>

      <scroll-view scroll-y class="modal-body">
        <view v-for="(unit, index) in formData.units" :key="index" class="unit-item">
          <view class="unit-row">
            <text class="unit-label">{{ index + 1 }}单元</text>
          </view>
          <view class="unit-row">
            <text class="unit-label">梯数：</text>
            <input class="unit-input" type="number" v-model="unit.elevators" :maxlength="1" />
          </view>
          <view class="unit-row">
            <text class="unit-label">户数：</text>
            <input
              class="unit-input"
              type="number"
              :value="unit.roomCount"
              @input="handleRoomCountChange($event, unit)"
              :maxlength="1"
            />
          </view>
          <view class="unit-row">
            <text class="unit-label">层数：</text>
            <input class="unit-input" type="number" v-model="unit.totalFloors" :maxlength="2" />
          </view>
        </view>

        <view class="add-btn-wrapper">
          <button class="config-btn add-btn" @click="addUnit">
            <text class="add-icon">+</text>
            <text>添加单元</text>
          </button>
        </view>
      </scroll-view>

      <view class="modal-footer">
        <button class="config-btn cancel-btn" @click="handleClose">取消</button>
        <button class="config-btn confirm-btn" @click="handleConfirm">确定</button>
      </view>
    </view>
  </view>
</template>

<style>
.unit-config-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

.modal-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
}

.modal-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 560rpx;
  background: #fff;
  border-radius: 8rpx;
  overflow: hidden;
}

.modal-header {
  padding: 20rpx 24rpx;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
}

.modal-close {
  font-size: 36rpx;
  color: #999;
  padding: 0 16rpx;
}

.modal-body {
  padding: 24rpx;
  max-height: 800rpx;
}

.unit-item {
  margin-bottom: 24rpx;
  padding: 16rpx;
  border-bottom: 1px solid #eee;
}

.unit-row {
  display: flex;
  align-items: center;
  height: 64rpx;
}

.unit-label {
  font-size: 28rpx;
  color: #333;
  width: 120rpx;
}

.unit-input {
  width: 120rpx;
  height: 60rpx;
  border: 1px solid #ddd;
  border-radius: 4rpx;
  text-align: center;
  font-size: 28rpx;
  background: #fff;
}

/* 统一按钮样式 */
.config-btn {
  height: 60rpx;
  line-height: 60rpx;
  font-size: 28rpx;
  padding: 0 30rpx;
  border-radius: 4rpx;
  background: #fff;
  border: 1px solid #fde247;
  color: #333;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.config-btn:active {
  opacity: 0.8;
}

.add-btn-wrapper {
  display: flex;
  justify-content: center;
  padding: 20rpx 0;
}

.add-btn {
  width: 240rpx;
  margin: 0;
}

.add-icon {
  font-size: 28rpx;
  margin-right: 8rpx;
}

.modal-footer {
  padding: 20rpx 24rpx;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
}

.cancel-btn {
  width: 140rpx;
  border-color: #ddd;
  color: #666;
}

.confirm-btn {
  width: 140rpx;
}
</style>

<script setup>
import { ref, reactive } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  config: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:show', 'confirm'])

const formData = reactive({
  buildingName: props.config.buildingName,
  units: JSON.parse(JSON.stringify(props.config.units))
})

const addUnit = () => {
  formData.units.push({
    unitNo: formData.units.length + 1,
    elevators: 2,
    roomCount: 4,
    totalFloors: 18
  })
}

const removeUnit = (index) => {
  formData.units.splice(index, 1)
  formData.units.forEach((unit, idx) => {
    unit.unitNo = idx + 1
  })
}

const handleClose = () => {
  emit('update:show', false)
}

const handleConfirm = () => {
  // 确保所有数据都是数字类型
  const units = formData.units.map((unit) => ({
    ...unit,
    elevators: parseInt(unit.elevators) || 2,
    roomCount: parseInt(unit.roomCount) || 4,
    totalFloors: parseInt(unit.totalFloors) || 18
  }))

  emit('confirm', {
    buildingName: formData.buildingName,
    units
  })
  handleClose()
}

const handleRoomCountChange = (event, unit) => {
  const value = parseInt(event.detail.value)
  if (!isNaN(value)) {
    if (value < 1) {
      unit.roomCount = 1
    } else if (value > 8) {
      unit.roomCount = 8
    } else {
      unit.roomCount = value
    }
  } else {
    unit.roomCount = 4 // 默认值
  }
}
</script>
