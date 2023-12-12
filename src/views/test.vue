<template>
  <div>
    <transition-group name="fade" tag="ul">
      <li v-for="(item, index) in items" :key="index" class="list-item">
        {{ item }}
      </li>
    </transition-group>

    <button @click="addItem">Add Item</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: ['Item 1', 'Item 2', 'Item 3'],
    };
  },
  methods: {
    addItem() {
      this.items.push(`Item ${this.items.length + 1}`);
    },
  },
};
</script>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
.list-item {
  margin: 10px;
  padding: 10px;
  border: 1px solid #ccc;
  background-color: #f0f0f0;
}
</style>
