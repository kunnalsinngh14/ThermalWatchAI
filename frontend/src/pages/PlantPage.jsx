import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Factory, Cog, Zap, Activity, Leaf, Gauge, BatteryCharging, PlayCircle, Wrench } from 'lucide-react';
import { KPICard } from '../components/dashboard/KPICard';
import { TelemetryChart } from '../components/dashboard/TelemetryChart';
import { GaugeChart } from '../components/dashboard/GaugeChart';
import { MetricCard } from '../components/dashboard/MetricCard';
import { useAuth } from '../hooks/useAuth';

export const PlantPage = () => {
  const { plantId } = useParams();
  const { role } = useAuth();
  
  const [data, setData] = useState({
    name: 'Loading...',
    kpis: { units: 0, faults: 0, capacity: 0, runningUnits: 0, maintenanceUnits: 0 },
    powerData: [],
    dailyPowerData: [],
    efficiency: { plantEff: 0, auxPower: 0, capacityUtil: 0 },
    environmental: { waterData: [], coalData: [], co2Data: [], flyAshData: [] }
  });

  useEffect(() => {
    const generateTimeData = (base, varRange, unit) => {
      const now = new Date();
      return Array.from({ length: 12 }, (_, i) => {
        const time = new Date(now.getTime() - (11 - i) * 600000);
        return {
          time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: Math.floor(base + (Math.random() * varRange - varRange / 2)),
          unit
        };
      });
    };

    const generateDailyData = (base, varRange) => {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return days.map((day) => ({
        time: day,
        value: Math.floor(base + (Math.random() * varRange - varRange / 2)),
        unit: 'MWh'
      }));
    };

    const fetchData = async () => {
      try {
        const { api } = await import('../services/api');
        let plantName = `Plant #${plantId}`;
        let unitsCount = 0, faultsCount = 0, capacityCount = 0;
        let runningUnits = 0, maintenanceUnits = 0;
        let dailyPower = [];
        let dailyWater = [];
        let dailyCoal = [];
        let dailyCo2 = [];
        let dailyFlyAsh = [];

        try {
          const plants = await api.get('/plants');
          const plant = plants.find(p => p.id.toString() === plantId);
          if (plant) {
            plantName = plant.name;
            unitsCount = plant.units;
            faultsCount = plant.faults;
            capacityCount = parseFloat(plant.capacity);
          }
        } catch (e) { console.error('Failed to fetch plant data', e); }

        try {
          const allUnits = await api.get('/units');
          const plantUnits = allUnits.filter(u => u.plantId.toString() === plantId);
          runningUnits = plantUnits.filter(u => u.status === 'running').length;
          maintenanceUnits = plantUnits.filter(u => u.status === 'under_maintenance').length;
          faultsCount = plantUnits.filter(u => u.status === 'faulty').length;
        } catch (e) {
          runningUnits = unitsCount - faultsCount;
          maintenanceUnits = 0;
        }

        let submissionsList = [];
        try {
          const submissions = await api.get(`/submissions?plant_id=${plantId}`);
          if (submissions && submissions.length > 0) {
            // Sort submissions chronologically by date
            submissions.sort((a, b) => new Date(a.date) - new Date(b.date));
            submissionsList = submissions;

            submissions.forEach(s => {
              const dateStr = s.date;
              const parts = dateStr.split('-');
              const label = `${parts[1]}-${parts[2]}`; // "MM-DD"
              
              dailyPower.push({ time: label, value: s.powerGenerated, unit: 'MWh' });
              dailyWater.push({ time: label, value: s.waterConsumption, unit: 'm³' });
              dailyCoal.push({ time: label, value: s.coalConsumption, unit: 't' });
              dailyCo2.push({ time: label, value: s.co2Emissions, unit: 't' });
              dailyFlyAsh.push({ time: label, value: s.flyAsh, unit: 't' });
            });

            // Append virtual placeholder next day
            const lastSub = submissions[submissions.length - 1];
            const lastDate = new Date(lastSub.date);
            const nextDate = new Date(lastDate.getTime() + 24 * 60 * 60 * 1000);
            const nextMonth = String(nextDate.getMonth() + 1).padStart(2, '0');
            const nextDay = String(nextDate.getDate()).padStart(2, '0');
            const nextLabel = `${nextMonth}-${nextDay}`;

            dailyPower.push({ time: nextLabel, value: lastSub.powerGenerated, unit: 'MWh' });
            dailyWater.push({ time: nextLabel, value: lastSub.waterConsumption, unit: 'm³' });
            dailyCoal.push({ time: nextLabel, value: lastSub.coalConsumption, unit: 't' });
            dailyCo2.push({ time: nextLabel, value: lastSub.co2Emissions, unit: 't' });
            dailyFlyAsh.push({ time: nextLabel, value: lastSub.flyAsh, unit: 't' });
          }
        } catch (e) {
          console.error("Failed to fetch plant submissions", e);
        }

        const hasSubmissions = dailyPower.length > 0;
        const latestSubmission = hasSubmissions ? submissionsList[submissionsList.length - 1] : null;

        setData({
          name: plantName,
          kpis: { units: unitsCount, faults: faultsCount, capacity: capacityCount, runningUnits, maintenanceUnits },
          powerData: hasSubmissions && latestSubmission 
            ? generateTimeData(Math.round(latestSubmission.powerGenerated / 24), 30, 'MW') 
            : [],
          dailyPowerData: dailyPower,
          efficiency: {
            plantEff: (() => {
              if (!hasSubmissions || !submissionsList.length) return 0;
              const totalPower = submissionsList.reduce((sum, s) => sum + s.powerGenerated, 0);
              const totalCoal = submissionsList.reduce((sum, s) => sum + s.coalConsumption, 0);
              return totalCoal > 0 ? Math.min(50, (totalPower / (totalCoal * 8.14)) * 100 / submissionsList.length) : 0;
            })(),
            auxPower: hasSubmissions && latestSubmission ? latestSubmission.auxiliaryPower : 0,
            capacityUtil: (hasSubmissions && latestSubmission && capacityCount > 0)
              ? Math.min(100, ((latestSubmission.powerGenerated / 24) / capacityCount) * 100)
              : 0
          },
          environmental: {
            waterData: dailyWater,
            coalData: dailyCoal,
            co2Data: dailyCo2,
            flyAshData: dailyFlyAsh
          }
        });
      } catch (err) { console.error(err); }
    };

    fetchData();
  }, [plantId, role]);

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      <h2 style={{ marginBottom: '24px', fontWeight: 500 }}>{data.name} — Dashboard</h2>
      
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <KPICard title="Total Units" value={data.kpis.units} icon={Cog} colorClass="border-crimson" />
        <KPICard title="Net Capacity" value={`${data.kpis.capacity} MW`} icon={Zap} colorClass="border-amber" />
        <KPICard title="Running Units" value={data.kpis.runningUnits} icon={PlayCircle} colorClass="border-emerald" />
        <KPICard title="Under Maintenance" value={data.kpis.maintenanceUnits} icon={Wrench} colorClass="border-amber" />
        <KPICard title="Plant Status" value={data.kpis.faults > 0 ? 'WARNING' : 'HEALTHY'} icon={Factory} colorClass={data.kpis.faults > 0 ? "border-red" : "border-emerald"} />
      </div>

      {/* Power Generation */}
      <div className="section-header">
        <Zap size={18} className="section-icon text-crimson" />
        <h3>Power Generation</h3>
      </div>
      <div className="metric-grid-2">
        <TelemetryChart title="Unit Power Output (Real-Time)" data={data.powerData} dataKey="value" strokeColor="var(--accent-primary)" fillColor="var(--accent-primary)" />
        <TelemetryChart title="Power Generated Per Day" data={data.dailyPowerData} dataKey="value" strokeColor="var(--accent-amber)" fillColor="var(--accent-amber)" />
      </div>

      {/* Efficiency Metrics */}
      <div className="section-header">
        <Gauge size={18} className="section-icon text-emerald" />
        <h3>Efficiency Metrics</h3>
      </div>
      <div className="metric-grid">
        <GaugeChart title="Plant Efficiency" value={data.efficiency.plantEff} maxValue={50} unit="%" color="var(--accent-emerald)" />
        <MetricCard title="Auxiliary Power" value={data.efficiency.auxPower} unit="MW" icon={BatteryCharging} color="var(--accent-amber)" />
        <GaugeChart title="Capacity Utilization" value={data.efficiency.capacityUtil} maxValue={100} unit="%" color="var(--accent-cyan)" />
      </div>

      {/* Environmental Monitoring */}
      <div className="section-header">
        <Leaf size={18} className="section-icon text-emerald" />
        <h3>Environmental Monitoring</h3>
      </div>
      <div className="metric-grid-2">
        <TelemetryChart title="Water Consumption" data={data.environmental.waterData} dataKey="value" strokeColor="var(--accent-cyan)" fillColor="var(--accent-cyan)" />
        <TelemetryChart title="Coal Consumption" data={data.environmental.coalData} dataKey="value" strokeColor="var(--accent-amber)" fillColor="var(--accent-amber)" />
      </div>
      <div className="metric-grid-2" style={{ marginTop: '20px' }}>
        <TelemetryChart title="CO₂ Emissions" data={data.environmental.co2Data} dataKey="value" strokeColor="var(--accent-red)" fillColor="var(--accent-red)" />
        <TelemetryChart title="Fly Ash Generated" data={data.environmental.flyAshData} dataKey="value" strokeColor="var(--text-secondary)" fillColor="var(--text-secondary)" />
      </div>
    </div>
  );
};
