'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Settings, Save, RotateCcw } from 'lucide-react'

interface PomodoroSettingsType {
  workDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  sessionsUntilLongBreak: number
}

interface PomodoroSettingsProps {
  settings: PomodoroSettingsType
  onSettingsChange: (settings: PomodoroSettingsType) => void
}

export default function PomodoroSettings({ 
  settings, 
  onSettingsChange 
}: PomodoroSettingsProps) {
  const [localSettings, setLocalSettings] = useState(settings)
  const [hasChanges, setHasChanges] = useState(false)

  const handleChange = (key: keyof PomodoroSettingsType, value: number) => {
    const newSettings = { ...localSettings, [key]: value }
    setLocalSettings(newSettings)
    setHasChanges(JSON.stringify(newSettings) !== JSON.stringify(settings))
  }

  const handleSave = () => {
    onSettingsChange(localSettings)
    setHasChanges(false)
    
    // Save to localStorage for persistence
    localStorage.setItem('pomodoroSettings', JSON.stringify(localSettings))
  }

  const handleReset = () => {
    const defaultSettings: PomodoroSettingsType = {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      sessionsUntilLongBreak: 4
    }
    setLocalSettings(defaultSettings)
    setHasChanges(JSON.stringify(defaultSettings) !== JSON.stringify(settings))
  }

  const presets = [
    { name: 'Classic', work: 25, shortBreak: 5, longBreak: 15 },
    { name: 'Extended', work: 50, shortBreak: 10, longBreak: 30 },
    { name: 'Short Bursts', work: 15, shortBreak: 3, longBreak: 10 },
    { name: 'Deep Work', work: 90, shortBreak: 20, longBreak: 45 },
  ]

  const applyPreset = (preset: typeof presets[0]) => {
    const newSettings = {
      ...localSettings,
      workDuration: preset.work,
      shortBreakDuration: preset.shortBreak,
      longBreakDuration: preset.longBreak
    }
    setLocalSettings(newSettings)
    setHasChanges(JSON.stringify(newSettings) !== JSON.stringify(settings))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5" />
        <h2 className="text-xl font-semibold text-slate-900">Pomodoro Settings</h2>
      </div>

      {/* Presets */}
      <Card className="p-4">
        <h3 className="font-medium text-slate-900 mb-3">Quick Presets</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {presets.map((preset) => (
            <Button
              key={preset.name}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(preset)}
              className="text-left flex-col h-auto p-3"
            >
              <div className="font-medium text-xs">{preset.name}</div>
              <div className="text-xs text-slate-500">
                {preset.work}/{preset.shortBreak}m
              </div>
            </Button>
          ))}
        </div>
      </Card>

      {/* Custom Settings */}
      <Card className="p-6">
        <h3 className="font-medium text-slate-900 mb-4">Custom Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Work Duration */}
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Label htmlFor="workDuration">Work Duration (minutes)</Label>
            <Input
              id="workDuration"
              type="number"
              min="1"
              max="120"
              value={localSettings.workDuration}
              onChange={(e) => handleChange('workDuration', parseInt(e.target.value) || 25)}
              className="text-center"
            />
            <p className="text-xs text-slate-500">
              How long you want to focus for each session
            </p>
          </motion.div>

          {/* Short Break Duration */}
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Label htmlFor="shortBreakDuration">Short Break (minutes)</Label>
            <Input
              id="shortBreakDuration"
              type="number"
              min="1"
              max="30"
              value={localSettings.shortBreakDuration}
              onChange={(e) => handleChange('shortBreakDuration', parseInt(e.target.value) || 5)}
              className="text-center"
            />
            <p className="text-xs text-slate-500">
              Short break between work sessions
            </p>
          </motion.div>

          {/* Long Break Duration */}
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Label htmlFor="longBreakDuration">Long Break (minutes)</Label>
            <Input
              id="longBreakDuration"
              type="number"
              min="5"
              max="60"
              value={localSettings.longBreakDuration}
              onChange={(e) => handleChange('longBreakDuration', parseInt(e.target.value) || 15)}
              className="text-center"
            />
            <p className="text-xs text-slate-500">
              Longer break after multiple sessions
            </p>
          </motion.div>

          {/* Sessions Until Long Break */}
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Label htmlFor="sessionsUntilLongBreak">Sessions Until Long Break</Label>
            <Input
              id="sessionsUntilLongBreak"
              type="number"
              min="2"
              max="8"
              value={localSettings.sessionsUntilLongBreak}
              onChange={(e) => handleChange('sessionsUntilLongBreak', parseInt(e.target.value) || 4)}
              className="text-center"
            />
            <p className="text-xs text-slate-500">
              How many work sessions before a long break
            </p>
          </motion.div>
        </div>
      </Card>

      {/* Preview */}
      <Card className="p-4 bg-slate-50">
        <h4 className="font-medium text-slate-900 mb-2">Preview</h4>
        <p className="text-sm text-slate-600">
          Work for <span className="font-medium text-slate-900">{localSettings.workDuration} minutes</span>, 
          then take a <span className="font-medium text-slate-900">{localSettings.shortBreakDuration}-minute break</span>. 
          After <span className="font-medium text-slate-900">{localSettings.sessionsUntilLongBreak} sessions</span>, 
          take a <span className="font-medium text-slate-900">{localSettings.longBreakDuration}-minute long break</span>.
        </p>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleReset}
          className="flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset to Defaults
        </Button>

        <Button
          onClick={handleSave}
          disabled={!hasChanges}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Settings
        </Button>
      </div>
    </div>
  )
}
