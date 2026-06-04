/* directionA.jsx — "INDEX" editorial monochrome */

function IdxTab({ id, active, icon, label }) {
  return (
    <div className={"tab" + (active === id ? " active" : "")}>
      <Icon name={icon} size={21} stroke={active === id ? 1.9 : 1.6}
        color={active === id ? "var(--idx-ink)" : "var(--idx-faint)"} />
      <span>{label}</span>
    </div>
  );
}
function IdxTabBar({ active }) {
  return (
    <div className="tabbar">
      <IdxTab id="food" active={active} icon="food" label="Food" />
      <IdxTab id="weight" active={active} icon="weight" label="Weight" />
      <IdxTab id="steps" active={active} icon="steps" label="Steps" />
      <IdxTab id="sleep" active={active} icon="sleep" label="Sleep" />
    </div>
  );
}
function IdxHeader() {
  return (
    <div className="idx-header">
      <Icon name="home" size={22} color="var(--idx-accent)" stroke={1.9} />
      <div className="idx-word">Vital<b>e</b></div>
      <div className="idx-ico"><Icon name="user" size={18} color="var(--idx-soft)" /></div>
    </div>
  );
}

function Macro({ name, val, unit, goal, pct, over }) {
  return (
    <div className="idx-macro">
      <div className="idx-macro-top">
        <span className="idx-macro-name">{name}</span>
        <span className="idx-macro-val">{val}<s>{unit}</s></span>
      </div>
      <div className="idx-bar"><i className={over ? "over" : ""} style={{ width: Math.min(100, pct * 100) + "%" }} /></div>
      <div className={"idx-macro-goal" + (over ? " over" : "")}>{goal}{over ? "  ·  over" : ""}</div>
    </div>
  );
}

function IdxDashboard({ bare }) {
  return (
    <Phone themeClass="idx" bare={bare}>
      <IdxHeader />
      <div className="scroll idx-scroll">
        <div className="idx-eyebrow">GOOD EVENING, SARAH</div>
        <div className="idx-daynav">
          <div className="idx-arrow"><Icon name="chevL" size={16} color="var(--idx-soft)" /></div>
          <div style={{ textAlign: "center" }}>
            <div className="idx-day">Yester<em>day</em></div>
            <div className="idx-daysub">Back to today</div>
          </div>
          <div className="idx-arrow"><Icon name="chevR" size={16} color="var(--idx-soft)" /></div>
        </div>

        <hr className="idx-rule" />
        <div className="idx-cal">
          <div className="idx-calnum">1,685</div>
          <div className="idx-calmeta">
            <div className="u">CAL</div>
            <div className="g">of 1,700 goal</div>
          </div>
        </div>
        <div className="idx-track"><i style={{ width: "99%" }} /></div>
        <div className="idx-macro-goal" style={{ textAlign: "right", marginTop: 6 }}>15 cal under</div>

        <div className="idx-grid2" style={{ marginTop: 14 }}>
          <Macro name="Protein" val="83" unit="g" goal="≥ 130 g" pct={0.64} />
          <Macro name="Carbs" val="159" unit="g" goal="≤ 175 g" pct={0.91} />
          <Macro name="Fat" val="84" unit="g" goal="≤ 58 g" pct={1} over />
          <Macro name="Fiber" val="30" unit="g" goal="≥ 25 g" pct={1} />
          <Macro name="Sugar" val="41" unit="g" goal="≤ 35 g" pct={1} over />
          <Macro name="Sodium" val="1,530" unit="mg" goal="≤ 2,200 mg" pct={0.7} />
          <Macro name="Steps" val="9,250" unit="" goal="≥ 8,000" pct={1} />
          <Macro name="Sleep" val="7.5" unit="h" goal="≥ 7.5 h" pct={1} />
        </div>
      </div>
      <IdxTabBar active={null} />
    </Phone>
  );
}

function IdxFood({ bare }) {
  return (
    <Phone themeClass="idx" bare={bare}>
      <IdxHeader />
      <div className="scroll idx-scroll">
        <h1 className="idx-h1">Log food</h1>

        <div className="idx-section-label"><b>When &amp; what</b><div className="ln" /></div>
        <div className="idx-row">
          <div className="idx-field">
            <label className="idx-flabel">Date</label>
            <div className="idx-select"><span>05/22/26</span><Icon name="cal" size={17} color="var(--idx-faint)" /></div>
          </div>
          <div className="idx-field">
            <label className="idx-flabel">Meal</label>
            <div className="idx-select"><span>Dinner</span><Icon name="chevD" size={16} color="var(--idx-faint)" /></div>
          </div>
        </div>
        <div className="idx-field">
          <label className="idx-flabel">Food name *</label>
          <div className="idx-input focus ph" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>Search or type food…</span>
          </div>
          <div className="idx-camera">
            <div className="idx-chip"><Icon name="camera" size={17} /> Scan a photo</div>
            <div className="idx-chip" style={{ flex: "0 0 46px" }}><Icon name="close" size={16} /></div>
          </div>
        </div>

        <div className="idx-section-label"><b>Amount</b><div className="ln" /></div>
        <div className="idx-row">
          <div className="idx-field">
            <label className="idx-flabel">Serving size</label>
            <div className="idx-input ph">4 oz, 1 cup…</div>
          </div>
          <div className="idx-field" style={{ flex: "0 0 96px" }}>
            <label className="idx-flabel">Servings</label>
            <div className="idx-input" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>1</span>
              <span className="idx-stepbtns"><Icon name="up" size={13} color="var(--idx-faint)" /><Icon name="down" size={13} color="var(--idx-faint)" /></span>
            </div>
          </div>
        </div>

        <div className="idx-section-label"><b>Calories &amp; macros</b><div className="ln" /></div>
        <div className="idx-field">
          <label className="idx-flabel">Calories *</label>
          <div className="idx-input ph" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>0</span>
            <span className="idx-stepbtns"><Icon name="up" size={13} color="var(--idx-faint)" /><Icon name="down" size={13} color="var(--idx-faint)" /></span>
          </div>
        </div>
        <div className="idx-row">
          <div className="idx-field">
            <label className="idx-flabel">Protein (g)</label>
            <div className="idx-input ph">0</div>
          </div>
          <div className="idx-field">
            <label className="idx-flabel">Carbs (g)</label>
            <div className="idx-input ph">0</div>
          </div>
        </div>
        <div className="idx-cta"><span>Save entry</span> <Icon name="chevR" size={16} color="var(--idx-bg)" /></div>
      </div>
      <IdxTabBar active="food" />
    </Phone>
  );
}

function IdxSteps({ bare }) {
  return (
    <Phone themeClass="idx" bare={bare}>
      <IdxHeader />
      <div className="scroll idx-scroll">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
          <h1 className="idx-h1">Steps</h1>
          <div className="idx-seg"><b className="on">7d</b><b>14d</b><b>30d</b></div>
        </div>
        <div className="idx-eyebrow" style={{ marginTop: 16 }}>WEEKLY AVERAGE</div>
        <div className="idx-cal" style={{ margin: "6px 0 2px" }}>
          <div className="idx-calnum" style={{ fontSize: 64 }}>9,840</div>
          <div className="idx-calmeta"><div className="u">STEPS / DAY</div><div className="g" style={{ color: "var(--idx-accent)" }}>+23% vs last week</div></div>
        </div>
        <div style={{ margin: "18px 0 6px" }}>
          <LineChart
            data={[11200, 8800, 7200, 13100, 6400, 9400, 10200]}
            labels={["5/16","5/17","5/18","5/19","5/20","5/21","5/22"]}
            yticks={[{v:14000,t:"14k"},{v:10000,t:"10k"},{v:6000,t:"6k"}]}
            color="var(--idx-accent)" dot="var(--idx-accent)" track="var(--idx-line)" w={330} h={168}
          />
        </div>
        <hr className="idx-rule" style={{ margin: "8px 0 0" }} />

        <div className="idx-section-label"><b>Log steps</b><div className="ln" /></div>
        <div className="idx-field">
          <label className="idx-flabel">Date</label>
          <div className="idx-select"><span>05/22/26</span><Icon name="cal" size={17} color="var(--idx-faint)" /></div>
        </div>
        <div className="idx-field">
          <label className="idx-flabel">Steps *</label>
          <div className="idx-input ph" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>0</span>
            <span className="idx-stepbtns"><Icon name="up" size={13} color="var(--idx-faint)" /><Icon name="down" size={13} color="var(--idx-faint)" /></span>
          </div>
        </div>
        <div className="idx-cta"><span>Log steps</span> <Icon name="chevR" size={16} color="var(--idx-bg)" /></div>
      </div>
      <IdxTabBar active="steps" />
    </Phone>
  );
}

function IdxProfile({ bare }) {
  return (
    <Phone themeClass="idx" bare={bare}>
      <IdxHeader />
      <div className="scroll idx-scroll">
        <h1 className="idx-h1">Profile</h1>

        <div className="idx-section-label"><b>Preferences</b><div className="ln" /></div>
        <div className="idx-field">
          <label className="idx-flabel">Units</label>
          <div className="idx-select"><span>Imperial · lbs, ft/in</span><Icon name="chevD" size={16} color="var(--idx-faint)" /></div>
        </div>
        <div className="idx-field">
          <label className="idx-flabel">Display name</label>
          <div className="idx-input">Sarah</div>
        </div>
        <div className="idx-row">
          <div className="idx-field">
            <label className="idx-flabel">Age</label>
            <div className="idx-input">31</div>
          </div>
          <div className="idx-field">
            <label className="idx-flabel">Biological sex</label>
            <div className="idx-select"><span>Female</span><Icon name="chevD" size={16} color="var(--idx-faint)" /></div>
          </div>
        </div>
        <div className="idx-row">
          <div className="idx-field">
            <label className="idx-flabel">Height (ft)</label>
            <div className="idx-input">5</div>
          </div>
          <div className="idx-field">
            <label className="idx-flabel">Height (in)</label>
            <div className="idx-input">5</div>
          </div>
        </div>

        <div className="idx-section-label"><b>Goals</b><div className="ln" /></div>
        <div className="idx-row" style={{ alignItems: "flex-end" }}>
          <div className="idx-field" style={{ marginBottom: 0 }}>
            <label className="idx-flabel">Current weight</label>
            <div className="idx-input" style={{ color: "var(--idx-faint)" }}>145.4 lbs</div>
          </div>
          <div className="idx-field" style={{ marginBottom: 0 }}>
            <label className="idx-flabel">Goal weight</label>
            <div className="idx-input" style={{ color: "var(--idx-accent)" }}>142.0</div>
          </div>
        </div>
        <div className="idx-field" style={{ marginTop: 16 }}>
          <label className="idx-flabel">Activity level</label>
          <div className="idx-select"><span>Lightly active · 1–3 days/wk</span><Icon name="chevD" size={16} color="var(--idx-faint)" /></div>
        </div>
      </div>
      <IdxTabBar active={null} />
    </Phone>
  );
}

Object.assign(window, { IdxDashboard, IdxFood, IdxSteps, IdxProfile });
