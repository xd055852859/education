import { ResultProps } from "@/interface/Common";
import * as qiniu from "qiniu-js";
import api from "./api";
import { ElMessage } from "element-plus";

export const getSearchParamValue = (search: string, paramName: string) => {
  const QUERY_PARAMS: string = new URLSearchParams(search).get(
    paramName
  ) as string;
  if (QUERY_PARAMS) {
    return QUERY_PARAMS;
  } else {
    return null;
  }
};

// 生成标识符
export const guid = (len, radix) => {
  var chars =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
  var uuid: any = [],
    i;
  radix = radix || chars.length;

  if (len) {
    // Compact form
    for (i = 0; i < len; i++) uuid[i] = chars[0 | (Math.random() * radix)];
  } else {
    // rfc4122, version 4 form
    var r;

    // rfc4122 requires these characters
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = "-";
    uuid[14] = "4";

    // Fill in random data.  At i==19 set the high bits of clock sequence as
    // per rfc4122, sec. 4.1.5
    for (i = 0; i < 36; i++) {
      if (!uuid[i]) {
        r = 0 | (Math.random() * 16);
        uuid[i] = chars[i === 19 ? (r & 0x3) | 0x8 : r];
      }
    }
  }
  return uuid.join("");
};

export const uploadFile = async (
  file,
  mimeType,
  callback,
  fileType?: string
) => {
  if (!file) {
    // dispatch(setMessage([true, "error", "无文件"]));
    return;
  }
  // if (file.size > 20000000) {
  //   alert("文件不能大于20M,请重新选择");
  //   return;
  // }
  let uploadRes: any = await api.request.get("account/qiniuToken", {
    target: "cdn-feisuo",
  });
  if (uploadRes.msg === "OK") {
    let uptoken = uploadRes.data;
    const domain = "https://cdn-feisuo.qingtime.cn/";
    let putExtra = {
      // 文件原文件名
      fname: "",
      // 自定义变量
      params: {},
      // 限制上传文件类型
      mimeType: mimeType,
    };
    let config = {
      useCdnDomain: true,
      disableStatisticsReport: false,
      retryCount: 5,
      region: qiniu.region["cn-east-2"],
      forceDirect: true,
    };
    let observer = {
      next(res) {},
      error(err) {
        ElMessage.error(err.message);
      },
      complete(res) {
        console.log(domain + res.key);
        callback(domain + res.key, file.name);
        //return domain + res.key;
      },
    };
    // 上传
    let observable = qiniu.upload(
      file,
      fileType
        ? new Date().getTime() + "_cjyy." + fileType
        : new Date().getTime() +
            "_cjyy" +
            (file.name ? file.name.substr(file.name.lastIndexOf(".")) : ".png"),
      uptoken,
      putExtra,
      config
    );
    // 上传开始
    observable.subscribe(observer);
  }
};
export const is_mobile = () => {
  let regex_match =
    /(nokia|iphone|android|motorola|^mot-|softbank|foma|docomo|kddi|up.browser|up.link|htc|dopod|blazer|netfront|helio|hosin|huawei|novarra|CoolPad|webos|techfaith|palmsource|blackberry|alcatel|amoi|ktouch|nexian|samsung|^sam-|s[cg]h|^lge|ericsson|philips|sagem|wellcom|bunjalloo|maui|symbian|smartphone|midp|wap|phone|windows ce|iemobile|^spice|^bird|^zte-|longcos|pantech|gionee|^sie-|portalmmm|jigs browser|hiptop|^benq|haier|^lct|operas*mobi|opera*mini|320x320|240x320|176x220|Mobile|iPad)/i;
  let u = navigator.userAgent;
  if (null == u) {
    return true;
  }
  let result = regex_match.exec(u);

  if (null == result) {
    return false;
  } else {
    return true;
  }
};

export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    ///FileReader类就是专门用来读文件的
    const reader = new FileReader();
    //开始读文件
    //readAsDataURL: dataurl它的本质就是图片的二进制数据， 进行base64加密后形成的一个字符串，
    reader.readAsDataURL(file);
    // 成功和失败返回对应的信息，reader.result一个base64，可以直接使用
    reader.onload = () => resolve(reader.result);
    // 失败返回失败的信息
    reader.onerror = (error) => reject(error);
  });
};

export const base64ToFile = (dataurl, filename = "") => {
  let arr = dataurl.split(",");
  let mime = arr[0].match(/:(.*?);/)[1];
  let suffix = mime.split("/")[1];
  let bstr = atob(arr[1]);
  let n = bstr.length;
  let u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], `${filename}.${suffix}`, {
    type: mime,
  });
};
export const bytesToSize = (limit) => {
  var size = "";
  if (limit < 1024) {
    //小于0.1KB，则转化成B
    size = limit.toFixed(2) + "B";
  } else if (limit < 1024 * 1024) {
    //小于0.1MB，则转化成KB
    size = (limit / 1024).toFixed(2) + "KB";
  } else if (limit < 1024 * 1024 * 1024) {
    //小于0.1GB，则转化成MB
    size = (limit / (1024 * 1024)).toFixed(2) + "MB";
  } else if (limit < 1024 * 1024 * 1024 * 1024) {
    //其他转化成GB
    size = (limit / (1024 * 1024 * 1024)).toFixed(2) + "GB";
  } else {
    size = (limit / (1024 * 1024 * 1024 * 1024)).toFixed(2) + "TB";
  }

  var sizeStr = size + ""; //转成字符串
  var index = sizeStr.indexOf("."); //获取小数点处的索引
  var dou = sizeStr.substr(index + 1, 2); //获取小数点后两位的值
  if (dou == "00") {
    //判断后两位是否为00，如果是则删除00
    return sizeStr.substring(0, index) + sizeStr.substr(index + 3, 2);
  }
  return size;
};
export const loadFont = async (fontName, fontUrl) => {
  const font = new FontFace(fontName, `url(${fontUrl})`);
  await font.load();
  //@ts-ignore
  document.fonts.add(font);
};

export const useImageUrl = (
  folder: string = "",
  name: string,
  type: string = "png"
): string => {
  /**
   * @method vite动态引入图片
   * @params folder 文件夹名称 name 文件名称 type 文件格式 一般为png/jpg/webp/gif等...
   * @returns 图片
   */
  //useImageUrl('home', 'banner1', 'png')
  return new URL(`../assets/${folder}/${name}.${type}`, import.meta.url).href;
};

//下载文件
export const downloadFile = (url, fileName) => {
  fetch(url, {
    method: "get",
    mode: "no-cors",
    referrerPolicy: "no-referrer",
  })
    .then((res) => res.blob())
    .then((res) => {
      const aElement = document.createElement("a");
      aElement.setAttribute("download", fileName);
      const href = URL.createObjectURL(res);
      aElement.href = href;
      aElement.setAttribute("target", "_blank");
      aElement.click();
      URL.revokeObjectURL(href);
    });
};
//转换树
export const formatData = (nodes: any, nodeId: string) => {
  let obj: any = {
    ...nodes[nodeId],
    key: nodeId,
    label: nodes[nodeId].name,
    children: [],
  };

  if (nodes[nodeId].children && nodes[nodeId].children.length > 0) {
    nodes[nodeId].children.forEach((item: any) => {
      let nodeItem = formatData(nodes, item);
      obj.children.push(nodeItem);
    });
  }
  return obj;
};
export const formatMonth = (month: number, language: string) => {
  let obj: { en: string; zh: string; tc: string } | {} = {};
  switch (month) {
    case 1:
      obj = {
        en: "January",
        zh: "一月",
        tc: "壹月",
      };
      break;
    case 2:
      obj = {
        en: "February",
        zh: "二月",
        tc: "贰月",
      };
      break;
    case 3:
      obj = {
        en: "March",
        zh: "三月",
        tc: "叁月",
      };
      break;
    case 4:
      obj = {
        en: "April",
        zh: "四月",
        tc: "肆月",
      };
      break;
    case 5:
      obj = {
        en: "May",
        zh: "五月",
        tc: "伍月",
      };
      break;
    case 6:
      obj = {
        en: "June",
        zh: "六月",
        tc: "陆月",
      };
      break;
    case 7:
      obj = {
        en: "July",
        zh: "七月",
        tc: "柒月",
      };
      break;
    case 8:
      obj = {
        en: "August",
        zh: "八月",
        tc: "捌月",
      };
      break;
    case 9:
      obj = {
        en: "September",
        zh: "九月",
        tc: "玖月",
      };
      break;
    case 10:
      obj = {
        en: "October",
        zh: "十月",
        tc: "拾月",
      };
      break;
    case 11:
      obj = {
        en: "November",
        zh: "十一月",
        tc: "拾壹月",
      };
      break;
    case 12:
      obj = {
        en: "December",
        zh: "十二月",
        tc: "拾壹月",
      };
      break;
  }
  return obj[language];
};

export const formatWeek = (week: number, language: string) => {
  let obj: { en: string; zh: string; tc: string } | {} = {};
  switch (week) {
    case 1:
      obj = {
        en: "Monday",
        zh: "星期一",
        tc: "星期壹",
      };
      break;
    case 2:
      obj = {
        en: "Tuesday",
        zh: "星期二",
        tc: "星期贰",
      };
      break;
    case 3:
      obj = {
        en: "Wednesday",
        zh: "星期三",
        tc: "星期叁",
      };
      break;
    case 4:
      obj = {
        en: "Thursday",
        zh: "星期四",
        tc: "星期肆",
      };
      break;
    case 5:
      obj = {
        en: "Friday",
        zh: "星期五",
        tc: "星期伍",
      };
      break;
    case 6:
      obj = {
        en: "Saturday",
        zh: "星期六",
        tc: "星期陆",
      };
      break;
    case 0:
      obj = {
        en: "Sunday",
        zh: "星期日",
        tc: "星期日",
      };
      break;
  }
  return obj[language];
};
export const formatDay = (day: number, language: string) => {
  let str = "";
  if (language === "en") {
    switch (day) {
      case 1:
      case 21:
      case 31:
        str = "st";
        break;
      case 2:
      case 22:
        str = "nd";
        break;
      case 3:
      case 23:
        str = "rd";
        break;
      default:
        str = "th";
    }
  } else {
    str = "日";
  }
  return day + str;
};
