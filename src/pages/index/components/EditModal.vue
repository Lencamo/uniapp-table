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
          <view class="form-item">
            <text class="form-label">面积</text>
            <input
              class="form-input"
              type="number"
              v-model="formData.area"
              placeholder="请输入面积"
            />
          </view>

          <view class="form-item">
            <text class="form-label">备注</text>
            <textarea
              class="form-textarea"
              v-model="formData.remark"
              placeholder="请输入备注信息"
            />
          </view>
        </block>
      </scroll-view>

      <view class="modal-footer">
        <button class="modal-btn" size="mini" @click="handleClose">取消</button>
        <button
          v-if="showConfirm"
          class="modal-btn confirm-btn"
          size="mini"
          type="primary"
          @click="handleConfirm"
        >
          确定
        </button>
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
  }
})

const emit = defineEmits(['update:show', 'close', 'confirm'])

const formData = reactive({
  area: '',
  remark: ''
})

// 监听显示状态，重置表单
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      formData.area = ''
      formData.remark = ''
    }
  }
)

const handleClose = () => {
  emit('close')
}

const handleConfirm = () => {
  emit('confirm', {
    area: Number(formData.area),
    remark: formData.remark
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
  width: 80%;
  max-width: 600rpx;
  background: #fff;
  border-radius: 8rpx;
  overflow: hidden;
}

.modal-header {
  padding: 20rpx;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
}

.modal-close {
  font-size: 40rpx;
  color: #999;
  padding: 0 20rpx;
}

.modal-body {
  padding: 24rpx;
  height: 100%;
  box-sizing: border-box;
}

.selection-info {
  margin-bottom: 20rpx;
  padding: 20rpx;
  background: #f8f8f8;
  border-radius: 4rpx;
}

.selection-type {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 10rpx;
}

.selection-details {
  display: block;
  font-size: 24rpx;
  color: #666;
  white-space: pre-line;
}

.form-item {
  margin-bottom: 20rpx;
}

.form-label {
  display: block;
  margin-bottom: 10rpx;
  color: #666;
}

.form-input {
  width: 100%;
  height: 70rpx;
  border: 1px solid #ddd;
  border-radius: 4rpx;
  padding: 0 20rpx;
}

.form-textarea {
  width: 100%;
  height: 160rpx;
  border: 1px solid #ddd;
  border-radius: 4rpx;
  padding: 20rpx;
}

.modal-footer {
  padding: 20rpx;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 20rpx;
}

.modal-btn {
  min-width: 160rpx;
  margin: 0;
}

.confirm-btn {
  background: #fde247;
  border-color: #fde247;
  color: #333;
}
</style>
