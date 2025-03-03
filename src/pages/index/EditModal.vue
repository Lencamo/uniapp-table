<template>
  <view class="edit-modal" v-if="show">
    <view class="modal-mask" @click="onClose"></view>
    <view class="modal-content">
      <view class="modal-header">
        <text class="modal-title">{{ title }}</text>
        <text class="modal-close" @click="onClose">×</text>
      </view>
      <view class="modal-body">
        <!-- 选中类型 -->
        <view class="info-item">
          <text class="info-label">选中类型：</text>
          <text class="info-value">{{ selectionType }}</text>
        </view>

        <!-- 选中内容详情 -->
        <view class="info-item">
          <text class="info-label">详细信息：</text>
          <view class="info-details">
            {{ details }}
          </view>
        </view>
      </view>
      <!-- 添加底部按钮区域 -->
      <view v-if="showConfirm" class="modal-footer">
        <button class="confirm-btn" @click="onConfirm">确认</button>
        <button class="cancel-btn" @click="onClose">取消</button>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  show: Boolean,
  title: String,
  selectionType: String,
  details: String,
  showConfirm: Boolean, // 新增属性控制是否显示确认按钮
});

const emit = defineEmits(["close", "confirm"]);

const onClose = () => {
  emit("close");
};

const onConfirm = () => {
  emit("confirm");
};
</script>

<style>
/* 弹窗样式 */
.edit-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
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
  position: relative;
  width: 600rpx;
  background: #fff;
  border-radius: 8rpx;
  z-index: 1001;
}

.modal-header {
  padding: 30rpx;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 32rpx;
  color: #333;
  font-weight: bold;
}

.modal-close {
  font-size: 40rpx;
  color: #999;
  cursor: pointer;
}

.modal-body {
  padding: 30rpx;
}

.info-item {
  margin-bottom: 20rpx;
}

.info-label {
  font-size: 28rpx;
  color: #666;
  margin-right: 10rpx;
}

.info-value {
  font-size: 28rpx;
  color: #333;
}

.info-details {
  margin-top: 10rpx;
  font-size: 28rpx;
  color: #333;
  white-space: pre-line;
}

.modal-footer {
  padding: 20rpx 30rpx;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 20rpx;
}

.confirm-btn,
.cancel-btn {
  width: 160rpx;
  height: 60rpx;
  line-height: 60rpx;
  font-size: 28rpx;
  border-radius: 4rpx;
  text-align: center;
}

.confirm-btn {
  color: #333;
  background: #fff;
  border: 1px solid #fde247;
}

.cancel-btn {
  color: #999;
  background: #f5f5f5;
  border: 1px solid #eee;
}

.confirm-btn:hover {
  background: #fffcf0;
}

.cancel-btn:hover {
  background: #f0f0f0;
}
</style>
