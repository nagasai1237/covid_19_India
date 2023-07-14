const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbpath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3003, () => {
      console.log("Server Started at http://localhost:3003");
    });
  } catch (e) {
    console.log(`db Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//Get States API
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT 
        *
    FROM
        state
    ORDER BY
        state_id`;
  const statesArray = await db.all(getStatesQuery);
  const ans = (statesArray) => {
    return {
      stateId: statesArray.state_id,
      stateName: statesArray.state_name,
      population: statesArray.population,
    };
  };
  response.send(statesArray.map((eachArray) => ans(eachArray)));
});

//Get State API
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT 
        *
    FROM
        state
    WHERE
        state_id = ${stateId};`;
  const state = await db.get(getStateQuery);
  const ans = (state) => {
    return {
      stateId: state.state_id,
      stateName: state.state_name,
      population: state.population,
    };
  };
  response.send(ans(state));
});

//Post District API
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const postDistrictQuery = `
    INSERT INTO district
        (district_name, 
        state_id, 
        cases, 
        cured, 
        active, 
        deaths)
    VALUES (
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths});`;
  await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});

//Get District API
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT 
        *
    FROM
        district
    WHERE
        district_id=${districtId}`;
  const district = await db.get(getDistrictQuery);
  const ans = (district) => {
    return {
      districtId: district.district_id,
      districtName: district.district_name,
      stateId: district.state_id,
      cases: district.cases,
      cured: district.cured,
      active: district.active,
      deaths: district.deaths,
    };
  };
  response.send(ans(district));
});

//Delete District API
app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM district
    WHERE
        district_id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//Put District API
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
    UPDATE 
        district
    SET
    district_name='${districtName}',
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths}
    WHERE
    district_id=${districtId};`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//Get Stats API
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `
    SELECT 
        sum(cases) AS totalCases,
        sum(cured) AS totalCured,
        sum(active) AS totalActive,
        sum(deaths) AS totalDeaths
    FROM 
        district
    WHERE
        state_id = ${stateId};
    GROUP BY
        state_id;`;

  const stateStats = await db.get(getStatsQuery);
  response.send(stateStats);
});

//Get State API
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateQuery = `
    SELECT 
        state_name
    FROM
    state NATURAL JOIN district
    WHERE 
        district_id = ${districtId}`;
  const state = await db.get(getStateQuery);
  const ans = (state) => {
    return {
      stateName: state.state_name,
    };
  };
  response.send(ans(state));
});
module.exports = app;
