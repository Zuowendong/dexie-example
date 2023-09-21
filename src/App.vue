<template>
  <div @click="add">存入</div>
  <div @click="update">修改</div>
  <div @click="delItem">删除</div>
  <div @click="getItem">获取</div>
</template>

<script setup>
import { db } from "./db";

function add() {
  db.add({
    code: "previewCode1",
    data: JSON.stringify({ id: 1, pageType: true, list: [{ name: 1111 }] }),
  });
}
function update() {
  db.update("previewCode1", {
    code: "previewCode2",
    data: JSON.stringify({ id: 1, pageType: true, list: [{ name: 1111 }] }),
  });
}
function delItem() {
  db.delete("previewCode1");
}
async function getItem() {
  const res = await db.query_code("previewCode1");
  console.log("🔥🔥🔥🔥🔥🔥", res);
}
</script>

<style scoped>
div {
  padding: 4px 6px;
  background-color: aquamarine;
  border-radius: 6px;
  cursor: pointer;
}
</style>
