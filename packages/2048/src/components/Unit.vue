<template>
  <div :class="'color-' + num">
    {{ Number.isNaN(num) ? '' : `${num}` }}
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  num: number;
}>()
</script>

<style>
.color-NaN {
  background-color: #bbada0;
}

.color-2 {
  background-color: #eee4da;
}

.color-4 {
  background-color: #ede0c8;
}

.color-8 {
  background-color: #f2b179;
}

.color-16 {
  background-color: #f59563;
}

.color-32 {
  background-color: #f67c5f;
}

.color-64 {
  background-color: #f65e3b;
}

.color-128 {
  background-color: #edcf72;
}

.color-256 {
  background-color: #edcc61;
}

.color-512 {
  background-color: #edc850;
}

.color-1024 {
  background-color: #edc53f;
}

.color-2048 {
  background-color: #edc22e;
}
</style>
