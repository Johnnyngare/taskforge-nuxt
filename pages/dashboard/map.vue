//pages/dashboard/map.vue
<script setup lang="ts">
</script>

<template>
  <div>

    <h1>Map Page</h1>
    <div>
      <LMap
    style="height: 500px"
    :zoom="12"
    :center="[47.21322, -1.559482]"
    :use-global-leaflet="false"
  >
    <LTileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution="&amp;copy; <a href=&quot;https://www.openstreetmap.org/&quot;>OpenStreetMap</a> contributors"
      layer-type="base"
      name="OpenStreetMap"
    />
  </LMap>
  </div>
</div>


</template>