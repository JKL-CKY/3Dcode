import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import "./style.css";

const districts = [
  { id: "A1", name: "能源塔", status: "online", load: 82, risk: 18, height: 8.8, trend: "+12%", alert: "冷却效率稳定" },
  { id: "A2", name: "制造单元", status: "warning", load: 91, risk: 67, height: 11.6, trend: "-3%", alert: "产线温度偏高" },
  { id: "A3", name: "物流中枢", status: "online", load: 76, risk: 22, height: 7.2, trend: "+8%", alert: "吞吐正常" },
  { id: "B1", name: "数据中心", status: "online", load: 88, risk: 29, height: 10.3, trend: "+15%", alert: "GPU 队列繁忙" },
  { id: "B2", name: "安防哨站", status: "offline", load: 34, risk: 81, height: 6.4, trend: "-11%", alert: "边缘节点离线" },
  { id: "B3", name: "实验平台", status: "warning", load: 69, risk: 54, height: 9.5, trend: "+2%", alert: "气压波动" },
  { id: "C1", name: "调度大厅", status: "online", load: 72, risk: 25, height: 8.1, trend: "+9%", alert: "排程平稳" },
  { id: "C2", name: "储能阵列", status: "warning", load: 86, risk: 61, height: 12.2, trend: "+6%", alert: "峰值负荷接近阈值" },
  { id: "C3", name: "生态温室", status: "online", load: 58, risk: 17, height: 7.8, trend: "+4%", alert: "环境因子良好" }
];

const statusColors = {
  online: "#49e3a6",
  warning: "#ffb44c",
  offline: "#ff5f72"
};

const statusLabels = {
  online: "在线",
  warning: "预警",
  offline: "离线"
};

const app = document.querySelector("#app");

app.innerHTML = `
  <div class="dashboard">
    <div class="scene-host"></div>
    <div class="hud">
      <section class="panel top-bar">
        <div class="brand">
          <h1>智慧园区 3D 可视化中枢</h1>
          <p>可旋转场景、节点点击、状态筛选、动态事件流</p>
        </div>
        <div class="actions">
          <button class="btn" id="toggle-rotate">暂停自转</button>
          <button class="btn" id="reset-camera">重置视角</button>
        </div>
      </section>

      <section class="panel left-panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">运行总览</h2>
            <div class="panel-subtitle">实时指标与状态分布</div>
          </div>
          <div class="panel-subtitle" id="scene-time"></div>
        </div>
        <div class="metrics" id="metrics"></div>
        <div class="status-grid" id="status-grid"></div>
        <div class="legend">
          <span><i style="background:#49e3a6"></i>在线节点</span>
          <span><i style="background:#ffb44c"></i>预警节点</span>
          <span><i style="background:#ff5f72"></i>离线节点</span>
        </div>
      </section>

      <section class="panel right-panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">节点详情</h2>
            <div class="panel-subtitle">点击 3D 场景中的建筑查看细节</div>
          </div>
        </div>
        <div class="detail-card" id="detail-card"></div>
      </section>

      <section class="panel bottom-panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">控制与事件</h2>
            <div class="panel-subtitle">支持筛选、事件流、视角交互</div>
          </div>
          <div class="filters" id="filters">
            <button class="btn active" data-filter="all">全部</button>
            <button class="btn" data-filter="online">在线</button>
            <button class="btn" data-filter="warning">预警</button>
            <button class="btn" data-filter="offline">离线</button>
          </div>
        </div>
        <div class="events" id="events"></div>
      </section>
    </div>
    <div class="tooltip" id="tooltip"></div>
  </div>
`;

const sceneHost = document.querySelector(".scene-host");
const metricsEl = document.querySelector("#metrics");
const statusGridEl = document.querySelector("#status-grid");
const detailCardEl = document.querySelector("#detail-card");
const eventsEl = document.querySelector("#events");
const filtersEl = document.querySelector("#filters");
const tooltipEl = document.querySelector("#tooltip");
const sceneTimeEl = document.querySelector("#scene-time");
const rotateButton = document.querySelector("#toggle-rotate");
const resetButton = document.querySelector("#reset-camera");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x040812);
scene.fog = new THREE.Fog(0x040812, 40, 120);

const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 260);
camera.position.set(18, 20, 24);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
sceneHost.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxDistance = 60;
controls.minDistance = 10;
controls.maxPolarAngle = Math.PI * 0.48;
controls.target.set(0, 4, 0);

const ambientLight = new THREE.AmbientLight(0xa8c5ff, 1.25);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xd1e4ff, 2.2);
keyLight.position.set(14, 24, 10);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x287eff, 1.8);
rimLight.position.set(-12, 10, -18);
scene.add(rimLight);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(22, 80),
  new THREE.MeshStandardMaterial({
    color: 0x071524,
    metalness: 0.3,
    roughness: 0.8
  })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(42, 42, 0x1d7cff, 0x113151);
grid.material.opacity = 0.25;
grid.material.transparent = true;
scene.add(grid);

const stageRing = new THREE.Mesh(
  new THREE.RingGeometry(19.5, 20.1, 96),
  new THREE.MeshBasicMaterial({
    color: 0x2a8cff,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide
  })
);
stageRing.rotation.x = -Math.PI / 2;
stageRing.position.y = 0.02;
scene.add(stageRing);

const districtGroup = new THREE.Group();
scene.add(districtGroup);

const pickTargets = [];
const districtEntries = [];

const towerGeometry = new THREE.BoxGeometry(2.2, 1, 2.2);
const capGeometry = new THREE.CylinderGeometry(0.84, 0.84, 0.4, 20);
const haloGeometry = new THREE.RingGeometry(1.35, 1.75, 36);

districts.forEach((district, index) => {
  const angle = (index / districts.length) * Math.PI * 2;
  const radius = 11 + (index % 2) * 3.2;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const height = district.height;

  const root = new THREE.Group();
  root.position.set(x, 0, z);

  const tower = new THREE.Mesh(
    towerGeometry,
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(statusColors[district.status]).multiplyScalar(0.7),
      emissive: new THREE.Color(statusColors[district.status]).multiplyScalar(0.22),
      metalness: 0.45,
      roughness: 0.35
    })
  );
  tower.scale.y = height;
  tower.position.y = height / 2;
  tower.castShadow = true;
  tower.receiveShadow = true;
  tower.userData.districtId = district.id;
  root.add(tower);

  const cap = new THREE.Mesh(
    capGeometry,
    new THREE.MeshStandardMaterial({
      color: 0xdbe7ff,
      emissive: 0x224f88,
      metalness: 0.7,
      roughness: 0.22
    })
  );
  cap.position.y = height + 0.32;
  cap.castShadow = true;
  root.add(cap);

  const halo = new THREE.Mesh(
    haloGeometry,
    new THREE.MeshBasicMaterial({
      color: statusColors[district.status],
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.05;
  root.add(halo);

  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, height, 12),
    new THREE.MeshBasicMaterial({
      color: statusColors[district.status],
      transparent: true,
      opacity: 0.18
    })
  );
  beam.position.y = height / 2;
  root.add(beam);

  districtGroup.add(root);
  pickTargets.push(tower);
  districtEntries.push({
    district,
    root,
    tower,
    cap,
    halo,
    baseHeight: height,
    spinFactor: 0.45 + index * 0.03
  });
});

const linkMaterial = new THREE.LineBasicMaterial({
  color: 0x4e9eff,
  transparent: true,
  opacity: 0.28
});

for (let i = 0; i < districtEntries.length; i += 1) {
  const current = districtEntries[i];
  const next = districtEntries[(i + 1) % districtEntries.length];
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(current.root.position.x, 1.2, current.root.position.z),
    new THREE.Vector3(0, 4 + (i % 2) * 2, 0),
    new THREE.Vector3(next.root.position.x, 1.2, next.root.position.z)
  ]);

  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(curve.getPoints(32)),
    linkMaterial
  );
  scene.add(line);
}

const droneGroup = new THREE.Group();
scene.add(droneGroup);

for (let i = 0; i < 12; i += 1) {
  const drone = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 16, 16),
    new THREE.MeshBasicMaterial({
      color: i % 3 === 0 ? 0x49e3a6 : 0x7db4ff
    })
  );

  drone.userData = {
    angle: (i / 12) * Math.PI * 2,
    radius: 7 + (i % 4) * 2.3,
    speed: 0.2 + i * 0.02,
    altitude: 2.4 + (i % 3) * 1.2
  };

  droneGroup.add(drone);
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const clock = new THREE.Clock();

let activeFilter = "all";
let selectedDistrict = districts[0];
let hoveredDistrict = null;
let autoRotate = true;

function getFilteredDistricts() {
  return activeFilter === "all"
    ? districts
    : districts.filter((district) => district.status === activeFilter);
}

function renderMetrics() {
  const visibleDistricts = getFilteredDistricts();
  const avgLoad = Math.round(
    visibleDistricts.reduce((sum, item) => sum + item.load, 0) / visibleDistricts.length
  );
  const avgRisk = Math.round(
    visibleDistricts.reduce((sum, item) => sum + item.risk, 0) / visibleDistricts.length
  );
  const onlineCount = visibleDistricts.filter((item) => item.status === "online").length;

  metricsEl.innerHTML = `
    <div class="metric-card">
      <span>可见节点</span>
      <strong>${visibleDistricts.length}</strong>
    </div>
    <div class="metric-card">
      <span>在线节点</span>
      <strong>${onlineCount}</strong>
    </div>
    <div class="metric-card">
      <span>平均负载</span>
      <strong>${avgLoad}%</strong>
    </div>
    <div class="metric-card">
      <span>平均风险</span>
      <strong>${avgRisk}%</strong>
    </div>
  `;

  statusGridEl.innerHTML = ["online", "warning", "offline"]
    .map((status) => {
      const count = visibleDistricts.filter((district) => district.status === status).length;
      return `
        <div class="status-chip">
          <strong style="color:${statusColors[status]}">${count}</strong>
          <small>${statusLabels[status]}</small>
        </div>
      `;
    })
    .join("");
}

function renderDetails() {
  if (!selectedDistrict) {
    detailCardEl.innerHTML = `
      <div class="panel-subtitle">当前未选中节点，请点击场景中的建筑。</div>
    `;
    return;
  }

  detailCardEl.innerHTML = `
    <h3 class="detail-title">${selectedDistrict.name}</h3>
    <div class="panel-subtitle">节点编号 ${selectedDistrict.id}</div>
    <div class="detail-grid">
      <div class="detail-item">
        <span>状态</span>
        <strong style="color:${statusColors[selectedDistrict.status]}">${statusLabels[selectedDistrict.status]}</strong>
      </div>
      <div class="detail-item">
        <span>负载</span>
        <strong>${selectedDistrict.load}%</strong>
      </div>
      <div class="detail-item">
        <span>风险</span>
        <strong>${selectedDistrict.risk}%</strong>
      </div>
      <div class="detail-item">
        <span>趋势</span>
        <strong>${selectedDistrict.trend}</strong>
      </div>
      <div class="detail-item" style="grid-column:1 / -1">
        <span>最新告警</span>
        <strong>${selectedDistrict.alert}</strong>
      </div>
    </div>
  `;
}

function renderEvents() {
  const visibleDistricts = getFilteredDistricts();
  const hottest = [...visibleDistricts]
    .sort((a, b) => b.risk + b.load - a.risk - a.load)
    .slice(0, 4);

  eventsEl.innerHTML = hottest
    .map(
      (district) => `
        <div class="event-card">
          <strong style="color:${statusColors[district.status]}">${district.name}</strong>
          <span>${district.alert}</span>
          <small>负载 ${district.load}% · 风险 ${district.risk}% · 趋势 ${district.trend}</small>
        </div>
      `
    )
    .join("");
}

function refreshSelectionVisuals() {
  districtEntries.forEach((entry) => {
    const selected = selectedDistrict?.id === entry.district.id;
    const base = new THREE.Color(statusColors[entry.district.status]).multiplyScalar(0.7);
    const highlight = new THREE.Color(0xdde8ff);

    entry.tower.material.color.copy(selected ? highlight : base);
    entry.tower.material.emissive.set(selected ? 0x4b83ff : 0x12315a);
    entry.cap.material.emissive.set(selected ? 0x5a9bff : 0x224f88);
    entry.halo.material.opacity = selected ? 1 : 0.6;
  });
}

function applyFilter(nextFilter) {
  activeFilter = nextFilter;

  Array.from(filtersEl.querySelectorAll(".btn")).forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === nextFilter);
  });

  districtEntries.forEach((entry) => {
    const visible = nextFilter === "all" || entry.district.status === nextFilter;
    entry.root.visible = visible;
  });

  renderMetrics();
  renderEvents();
  refreshSelectionVisuals();
}

function selectDistrictById(districtId) {
  selectedDistrict = districts.find((district) => district.id === districtId) || null;
  renderDetails();
  refreshSelectionVisuals();
}

function updatePointerFromEvent(event) {
  const bounds = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
}

function handlePointerMove(event) {
  updatePointerFromEvent(event);
  raycaster.setFromCamera(pointer, camera);

  const intersections = raycaster.intersectObjects(pickTargets, false);

  if (intersections.length > 0) {
    const districtId = intersections[0].object.userData.districtId;
    hoveredDistrict = districts.find((item) => item.id === districtId) || null;
    tooltipEl.classList.add("visible");
    tooltipEl.style.left = `${event.clientX}px`;
    tooltipEl.style.top = `${event.clientY}px`;
    tooltipEl.innerHTML = `
      <strong>${hoveredDistrict.name}</strong>
      <div>状态：${statusLabels[hoveredDistrict.status]}</div>
      <div>负载：${hoveredDistrict.load}%</div>
      <div>风险：${hoveredDistrict.risk}%</div>
    `;
    return;
  }

  hoveredDistrict = null;
  tooltipEl.classList.remove("visible");
}

function handlePointerUp(event) {
  updatePointerFromEvent(event);
  raycaster.setFromCamera(pointer, camera);

  const intersections = raycaster.intersectObjects(pickTargets, false);

  if (intersections.length > 0) {
    selectDistrictById(intersections[0].object.userData.districtId);
  } else {
    selectedDistrict = null;
    renderDetails();
    refreshSelectionVisuals();
  }
}

function resetCamera() {
  camera.position.set(18, 20, 24);
  controls.target.set(0, 4, 0);
  controls.update();
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  renderer.setSize(window.innerWidth, window.innerHeight);
}

renderer.domElement.addEventListener("pointermove", handlePointerMove);
renderer.domElement.addEventListener("pointerup", handlePointerUp);

filtersEl.addEventListener("click", (event) => {
  const button = event.target.closest(".btn");
  if (!button) {
    return;
  }

  applyFilter(button.dataset.filter);
});

rotateButton.addEventListener("click", () => {
  autoRotate = !autoRotate;
  controls.autoRotate = autoRotate;
  rotateButton.textContent = autoRotate ? "暂停自转" : "开启自转";
});

resetButton.addEventListener("click", resetCamera);
window.addEventListener("resize", onResize);

controls.autoRotate = autoRotate;
controls.autoRotateSpeed = 0.7;

renderMetrics();
renderDetails();
renderEvents();
applyFilter("all");

function animate() {
  const elapsed = clock.getElapsedTime();

  districtEntries.forEach((entry, index) => {
    entry.tower.position.y = entry.baseHeight / 2 + Math.sin(elapsed * 1.8 + index) * 0.18;
    entry.cap.position.y = entry.baseHeight + 0.32 + Math.sin(elapsed * 1.8 + index) * 0.18;
    const haloScale = 0.92 + (Math.sin(elapsed * 2.4 + index * 0.6) + 1) * 0.08;
    entry.halo.scale.setScalar(haloScale);
    entry.root.rotation.y += elapsed * 0.0008 * entry.spinFactor;
  });

  droneGroup.children.forEach((drone) => {
    const { angle, radius, speed, altitude } = drone.userData;
    drone.position.set(
      Math.cos(angle + elapsed * speed) * radius,
      altitude + Math.sin(elapsed * 2 + radius) * 0.3,
      Math.sin(angle + elapsed * speed) * radius
    );
  });

  sceneTimeEl.textContent = new Date().toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  stageRing.rotation.z = elapsed * 0.1;
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

selectDistrictById(selectedDistrict.id);
animate();
