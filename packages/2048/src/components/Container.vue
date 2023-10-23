<template>
  <div>
    <div @click="handleStart">开始游戏</div>
    <div>
      <z-unit v-for="(num, index) in instance.board" :key="index" :num="num" />
    </div>
  </div>
</template>

<script lang='ts' setup>
import { ref } from 'vue'
import ZUnit from 'Unit.vue'
import { Instance } from './instance'

const instance = ref(new Instance())

function handleStart () {
  instance.value = new Instance()
}

</script>

<style>
</style>
