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
    </view>
  </view>
</template>

<script setup>
defineProps({
  show: Boolean,
  title: String,
  selectionType: String,
  details: String,
});

const emit = defineEmits(["close"]);

const onClose = () => {
  emit("close");
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
</style>
