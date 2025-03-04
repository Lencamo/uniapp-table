<template>
  <view v-if="show" class="edit-modal">
    <view class="modal-mask" @click="handleClose"></view>
    <view class="modal-content">
      <view class="modal-header">
        <text class="modal-title">{{ title }}</text>
        <text class="modal-close" @click="handleClose">×</text>
      </view>

      <scroll-view scroll-y class="modal-body">
        <!-- 选择类型显示 -->
        <view class="selection-info">
          <text class="selection-type">{{ selectionType }}</text>
          <text class="selection-details">{{ details }}</text>
        </view>

        <!-- 编辑区域 -->
        <block v-if="showConfirm">
          <view class="unit-row">
            <text class="unit-label">房号：</text>
            <input class="unit-input" type="text" v-model="formData.roomNo" />
          </view>

          <view class="unit-row">
            <text class="unit-label">面积：</text>
            <input class="unit-input" type="number" v-model="formData.area" />
            <text class="unit-suffix">㎡</text>
          </view>
        </block>
      </scroll-view>

      <view class="modal-footer">
        <button class="config-btn cancel-btn" @click="handleClose">取消</button>
        <button class="config-btn confirm-btn" @click="handleConfirm">确定</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '编辑'
  },
  selectionType: {
    type: String,
    default: ''
  },
  details: {
    type: String,
    default: ''
  },
  showConfirm: {
    type: Boolean,
    default: true
  },
  currentRoom: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:show', 'close', 'confirm'])

const formData = reactive({
  roomNo: props.currentRoom?.roomNo || '',
  area: props.currentRoom?.area || ''
})

// 监听显示状态和当前房间数据，更新表单
watch(
  [() => props.show, () => props.currentRoom],
  ([newShow, newRoom]) => {
    if (newShow && newRoom) {
      // 填充当前房间数据
      formData.roomNo = newRoom.roomNo || ''
      formData.area = newRoom.area || ''
    } else if (!newShow) {
      // 关闭时重置表单
      formData.roomNo = ''
      formData.area = ''
    }
  },
  { immediate: true }
)

const handleClose = () => {
  emit('close')
}

const handleConfirm = () => {
  emit('confirm', {
    roomNo: formData.roomNo,
    area: Number(formData.area) || 0
  })
}
</script>

<style>
.edit-modal {
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

.selection-info {
  margin-bottom: 20rpx;
  padding: 16rpx;
  background: #f8f8f8;
  border-radius: 4rpx;
}

.selection-type {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 8rpx;
}

.selection-details {
  display: block;
  font-size: 26rpx;
  color: #666;
  white-space: pre-line;
}

.unit-row {
  display: flex;
  align-items: center;
  height: 64rpx;
  margin-bottom: 16rpx;
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

.unit-suffix {
  font-size: 26rpx;
  color: #666;
  margin-left: 8rpx;
}

.modal-footer {
  padding: 20rpx 24rpx;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
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

.cancel-btn {
  width: 140rpx;
  border-color: #ddd;
  color: #666;
}

.confirm-btn {
  width: 140rpx;
}
</style>
