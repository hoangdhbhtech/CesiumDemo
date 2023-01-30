import {
  Ion,
  Viewer,
  createWorldTerrain,
  createOsmBuildings,
  Cartesian3,
  Math,
  PolygonHierarchy,
  Color,
  defined,
} from "cesium";
import "cesium/Widgets/widgets.css";
import "../src/css/main.css";

("use strict");

// Your access token can be found at: https://cesium.com/ion/tokens.
// This is the default access token
Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWE1OWUxNy1mMWZiLTQzYjYtYTQ0OS1kMWFjYmFkNjc5YzciLCJpZCI6NTc3MzMsImlhdCI6MTYyNzg0NTE4Mn0.XcKpgANiY19MC4bdFUXMVEBToBmqS8kuYpUlxJHYZxk";

// Initialize the Cesium Viewer in the HTML element with the `cesiumContainer` ID.
const viewer = new Viewer("cesiumContainer", {
  terrainProvider: createWorldTerrain(),
});

function xmlToJson(xml) {
  "use strict";
  // Create the return object
  var obj = {},
    i,
    j,
    attribute,
    item,
    nodeName,
    old;
  if (xml.nodeType === 1) {
    // element
    // do attributes
    if (xml.attributes.length > 0) {
      obj["attributes"] = {};
      for (j = 0; j < xml.attributes.length; j = j + 1) {
        attribute = xml.attributes.item(j);
        obj["attributes"][attribute.nodeName] = attribute.nodeValue;
      }
    }
  }
  // do children
  if (xml.hasChildNodes()) {
    for (i = 0; i < xml.childNodes.length; i = i + 1) {
      item = xml.childNodes.item(i);
      nodeName = item.nodeName;
      if (nodeName !== "#text") {
        if (obj[nodeName] === undefined) {
          obj[nodeName] = xmlToJson(item);
        } else {
          if (obj[nodeName].push === undefined) {
            old = obj[nodeName];
            obj[nodeName] = [];
            obj[nodeName].push(old);
          }
          obj[nodeName].push(xmlToJson(item));
        }
      }
    }
  }
  return obj;
}
function parseXml(xml) {
  var dom = null;
  if (window.DOMParser) {
    try {
      dom = new DOMParser().parseFromString(xml, "text/xml");
    } catch (e) {
      dom = null;
    }
  } else if (window.ActiveXObject) {
    try {
      dom = new ActiveXObject("Microsoft.XMLDOM");
      dom.async = false;
      if (!dom.loadXML(xml))
        // parse error ..
        window.alert(dom.parseError.reason + dom.parseError.srcText);
    } catch (e) {
      dom = null;
    }
  } else alert("cannot parse xml string!");
  return dom;
}
async function getData() {
  const response = await fetch(
    `https://s3.amazonaws.com/CMSTest/squaw_creek_container_info.xml?fbclid=IwAR0YUCBa-S_HrMLiXeJTsXdmBXJbLa3PoyCBjJKNlRggthLfNYcCxTogiuo`
  );
  var data = await response.text();
  const dom = parseXml(data);
  const dataXML = xmlToJson(dom);
  return dataXML;
}
getData().then((data) => {
  console.log(data);
  data.STRUCTURES.ROOF.FACES.FACE.map((data) => {
    console.log(data.POLYGON.attributes.path.split(","));
    console.log(data.POLYGON.attributes.id);
  });
  // var objectPolygon = [
  //   {
  //     POLYGON: {
  //       id: "",
  //       pathPolygon: "",
  //     },
  //     LINE: {
  //       id: "",
  //       pathLine: "",
  //     },
  //     POINT: {
  //       id: "",
  //       pathPoint: "",
  //     },
  //   },
  // ];
});
//
const url = "https://s3.amazonaws.com/CMSTest/squaw_creek_container_info.xml";
const api = async () => {
  try {
    fetch(url)
      .then((response) => response.text())
      .then((datas) => {
        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString(datas, "text/xml");
        console.log("xmlDoc", xmlDoc);
        //console.log(xml2js(xmlDoc,{compact:true}));
        //ĐẶT OBJECT
        var objectPolygon = {};
        var listPolygon = xmlDoc.getElementsByTagName("POLYGON");
        console.log(listPolygon);
        // lấy id từ polygon
        let listId = [];
        for (let i = 0; i < listPolygon.length; i++) {
          let idPolygon = listPolygon[i].getAttribute("id");
          listId.push(idPolygon);
        }
        console.log("listId", listId);
        //lấy list line từ polygon
        let listPathLine = [];
        for (let i = 0; i < listPolygon.length; i++) {
          //lấy ra L0, L1, L2, L3, L4, L5, L6
          let pathPolygon = listPolygon[i].getAttribute("path");
          let splitPathLine = pathPolygon.split(", ");
          listPathLine.push(splitPathLine);
        }
        console.log("listPathLine", listPathLine);
        //gán id vào path của polygon
        listId.forEach((element, index) => {
          objectPolygon[element] = listPathLine[index];
        });
        console.log(objectPolygon);
        //lấy id line
        const objLine = {};
        const listLine = xmlDoc.getElementsByTagName("LINE");
        const listIdLine = [];
        console.log("listLine", listLine);
        for (let i = 0; i < listLine.length; i++) {
          let idLine = listLine[i].getAttribute("id");
          listIdLine.push(idLine);
          //console.log("id", idLine);
        }
        const listPathPoint = [];
        for (let i = 0; i < listLine.length; i++) {
          //lấy ra C0,C1,C2,C3,C4,C5,C6,...
          let pathLine = listLine[i].getAttribute("path");
          let splitPathPoint = pathLine.split(", ");
          listPathPoint.push(splitPathPoint);
        }
        console.log("listPathPoint", listPathPoint);
        //găn id với path của line
        listIdLine.forEach((element, index) => {
          objLine[element] = listPathPoint[index];
        });
        console.log("objLine", objLine);
        const size = 3;
        for (let id in objectPolygon) {
          console.log("arr", objectPolygon[id]);
          objectPolygon[id].map((element) => {
            for (let key in objLine) {
              if (key === element) {
                return objectPolygon[id].splice(id, id + size, objLine[key]);
              }
            }
          }, []);
        }
        console.log("objectPolygon", objectPolygon);

        // lấy ra point trong file xml
        //  console.log( xmlDoc.querySelectorAll('POINT')) ;
        var list = xmlDoc.getElementsByTagName("POINT");
        //console.log(list);
        // lặp qua các phần tử của point
        let result = [];
        for (let i = 0; i < list.length; i++) {
          const a = list[i].getAttribute("data");
          result.push(a);
        }
        // chuyển các phần tử trong mảng sang dạng float
        const coordinatesSplit = result.map((arr) => {
          const floatVariable = arr.split(",");
          //console.log(floatVariable);
          //   for (let j = 0; j < floatVariable.length; j++) {
          //     return parseFloat(floatVariable[j]);
          //   }
          const coordinatesFloat = floatVariable.map((arr) => {
            return parseFloat(arr);
          }, []);

          return coordinatesFloat;
        }, []);
        console.log("coordinatesSplit", coordinatesSplit);
        const F0 = {
          F1: [].concat(
            coordinatesSplit[0],
            coordinatesSplit[1],
            coordinatesSplit[2],
            coordinatesSplit[3],
            coordinatesSplit[4],
            coordinatesSplit[5],
            coordinatesSplit[6]
          ),
          F2: [].concat(
            coordinatesSplit[7],
            coordinatesSplit[8],
            coordinatesSplit[9],
            coordinatesSplit[10],
            coordinatesSplit[11],
            coordinatesSplit[12],
            coordinatesSplit[13]
          ),
          F3: [].concat(
            coordinatesSplit[14],
            coordinatesSplit[15],
            coordinatesSplit[16],
            coordinatesSplit[17]
          ),
          F4: [].concat(
            coordinatesSplit[18],
            coordinatesSplit[19],
            coordinatesSplit[20],
            coordinatesSplit[21]
          ),
          F5: [].concat(
            coordinatesSplit[22],
            coordinatesSplit[23],
            coordinatesSplit[24]
          ),
          F6: [].concat(
            coordinatesSplit[25],
            coordinatesSplit[26],
            coordinatesSplit[27]
          ),
          F7: [].concat(
            coordinatesSplit[28],
            coordinatesSplit[29],
            coordinatesSplit[30]
          ),
          F8: [].concat(
            coordinatesSplit[31],
            coordinatesSplit[32],
            coordinatesSplit[33]
          ),
        };
        //in ra hình, và các tọa độ điểm
        for (let i in F0) {
          viewer.entities.add({
            name: `${i}`,
            polygon: {
              hierarchy: Cartesian3.fromDegreesArrayHeights(F0[i]),
              perPositionHeight: true,
              material: Color.ORANGE.withAlpha(0.5),
              outline: true,
              outlineColor: Color.BLACK,
            },
            description: Cartesian3.unpackArray(F0[i]),
          });
          viewer.zoomTo(viewer.entities);
          console.log(Cartesian3.unpackArray(F0[i]));
        }
        //
        viewer.selectedEntityChanged.addEventListener(function (entity) {
          if (defined(entity) && defined(entity.polygon) === true) {
            console.log(entity.name);
            entity.polygon.material = Color.fromRandom().withAlpha(0.5);
          }
        });
        // tinh trung điểm

        
        const arObj = coordinatesSplit.map((coord) => {
          return Object.assign({}, coord);
        }, []);
        console.log('arObj',arObj);
        let p3 = new Cartesian3(0.0, 0.0, 0.0);
        //     let f1 = new Cartesian3(
        //         arObj[1]
        //       );
        //       console.log(f1);
        //     let f2 = new Cartesian3(
        //         arObj[2]
        //       );
        //       console.log(Cartesian3.midpoint(f1, f2, p3))
// //         const a = arObj.reduce((acc,curr)=>{
// //             let p3 = new Cartesian3(0.0, 0.0, 0.0);
// //             let f1 = new Cartesian3(
// //                 acc
// //               );
// //               console.log(f1);
// //             let f2 = new Cartesian3(
// //                 curr
// //               );
// //               Cartesian3.midpoint(f1, f2, p3)
// //         },arObj[1])
// // console.log('a',a);

        
        let f1 = new Cartesian3(
          -93.62033081054688,
          42.01864242553711,
          278.75982666015625
        );
        console.log(f1);
        let f2 = new Cartesian3(
          -93.6204605102539,
          42.01866912841797,
          278.259521484375
        );
        console.log('Cartesian3',Cartesian3.midpoint(f1, f2, p3));
      });
  } catch (error) {
    console.log(error);
  }
};
api();
