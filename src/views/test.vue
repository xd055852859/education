<script setup lang="ts">
import "vue3-video-play/dist/style.css";
import * as echarts from "echarts";
import "echarts-wordcloud";
import { videoPlay } from "vue3-video-play";
import { base64ToFile } from "@/services/util";
import Timeline3d from "@/components/timeline3d.vue";

let chart: any = null;
let option: any = null;
onMounted(() => {
  let data: any = [];
  for (let i = 0; i < 10; ++i) {
    data.push({
      name: (i % 2 ? "WordCloud" : "WWWWWWWWWWordCloud") + i,
      value: (30 - i) * (30 - i),
    });
  }
  let chartDom: any = document.getElementById("main");
  chart = echarts.init(chartDom, null, {
    width: chartDom.parentElement.offsetWidth * 1.05,
    height: chartDom.parentElement.offsetHeight * 1.1,
  });
  option = {
    series: [
      {
        type: "wordCloud",

        // The shape of the "cloud" to draw. Can be any polar equation represented as a
        // callback function, or a keyword present. Available presents are circle (default),
        // cardioid (apple or heart shape curve, the most known polar equation), diamond (
        // alias of square), triangle-forward, triangle, (alias of triangle-upright, pentagon, and star.

        shape: "circle",

        // Keep aspect ratio of maskImage or 1:1 for shapes
        // This option is supported since echarts-wordcloud@2.1.0
        // keepAspect: false,

        // A silhouette image which the white area will be excluded from drawing texts.
        // The shape option will continue to apply as the shape of the cloud to grow.

        // maskImage: maskImage,

        // Folllowing left/top/width/height/right/bottom are used for positioning the word cloud
        // Default to be put in the center and has 75% x 80% size.

        left: "center",
        top: "center",
        width: "70%",
        height: "80%",
        right: null,
        bottom: null,

        // Text size range which the value in data will be mapped to.
        // Default to have minimum 12px and maximum 60px size.

        sizeRange: [12, 60],

        // Text rotation range and step in degree. Text will be rotated randomly in range [-90, 90] by rotationStep 45

        rotationRange: [-90, 90],
        rotationStep: 45,

        // size of the grid in pixels for marking the availability of the canvas
        // the larger the grid size, the bigger the gap between words.

        gridSize: 8,

        // set to true to allow word to be drawn partly outside of the canvas.
        // Allow word bigger than the size of the canvas to be drawn
        // This option is supported since echarts-wordcloud@2.1.0
        drawOutOfBound: false,

        // if the font size is too large for the text to be displayed,
        // whether to shrink the text. If it is set to false, the text will
        // not be rendered. If it is set to true, the text will be shrinked.
        // This option is supported since echarts-wordcloud@2.1.0
        shrinkToFit: false,

        // If perform layout animation.
        // NOTE disable it will lead to UI blocking when there is lots of words.
        layoutAnimation: true,

        // Global text style
        textStyle: {
          fontFamily: "sans-serif",
          fontWeight: "bold",
          // Color can be a callback function or a color string
          color: function () {
            // Random color
            return (
              "rgb(" +
              [
                Math.round(Math.random() * 160),
                Math.round(Math.random() * 160),
                Math.round(Math.random() * 160),
              ].join(",") +
              ")"
            );
          },
        },
        emphasis: {
          focus: "self",

          textStyle: {
            textShadowBlur: 10,
            textShadowColor: "#333",
          },
        },

        // Data is an array. Each array item must have name and value property.
        data,
      },
    ],
  };

  option && chart.setOption(option);
});
const videoRef = ref<any>(null);
const options = reactive({
  src: "https://cdn.jsdelivr.net/gh/xdlumia/files/video-play/IronMan.mp4", //视频源
  poster: "", //封面
});
const onPlay = (ev) => {
  console.log("播放");
};
const onPause = (ev) => {
  console.log(ev, "暂停");
};

const onTimeupdate = (ev) => {
  console.log(ev, "时间更新");
};
const onCanplay = (ev) => {
  console.log(ev, "可以播放");
};

const screenshot = (id, imgType) => {
  let video: any = document.getElementById(id);
  const width = video.videoWidth;
  const height = video.videoHeight;
  // 创建画布准备截图
  const canvas: any = document.createElement("canvas");
  // 设置video属性
  video.setAttribute("crossOrigin", "anonymous");
  // 设置画布的宽高
  canvas.width = width;
  canvas.height = height;
  // 图片绘制
  canvas.getContext("2d").drawImage(video, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    try {
      let dataURL = canvas.toDataURL(imgType);
      resolve(dataURL);
    } catch (error) {
      reject(error);
    }
  });
};
const getImg = () => {
  screenshot("video", "image/png").then((dataURL) => {
    const form = new FormData();
    console.log(dataURL);
    // form.append("file", base64ToFile(dataURL));
    const aElement = document.createElement("a");
    aElement.setAttribute("download", "测试");
    //@ts-ignore
    const href = URL.createObjectURL(base64ToFile(dataURL));
    aElement.href = href;
    aElement.setAttribute("target", "_blank");
    aElement.click();
  });
};
</script>
<template>
  <div>
    <!-- <videoPlay
      id="video"
      ref="videoRef"
      width="800px"
      title="钢铁侠"
      :src="options.src"
      :poster="options.poster"
      @play="onPlay"
      @pause="onPause"
      @timeupdate="onTimeupdate"
      @canplay="onCanplay"
      crossOrigin="Anonymous"
    /> -->
    <!-- <video src="https://cdn.jsdelivr.net/gh/xdlumia/files/video-play/IronMan.mp4" controls></video> -->
    
    <el-button type="primary" @click="getImg" style="margin-top: 20px"
      >截取</el-button
    >
    <div id="main"></div>
    <div id="border"></div>
  </div>
</template>
<style scoped lang="scss">
#main {
  width: 500px;
  height: 400px;
  margin: 50px;
  border: 1px solid #eee;
}
</style>
<style></style>
