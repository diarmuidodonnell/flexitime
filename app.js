// Global State
let workData = {
    weeklyTarget: 40,
    numDays: 5,
    dailyHours: [],
    constraints: [],
    preferences: {
        earliestStart: '07:00',
        latestEnd: '19:00',
        idealStart: '09:00',
        idealEnd: '17:00'
    }
};

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    loadFromStorage();
    initializeScheduleInputs();
    loadConstraints();
    updateDashboard();
    updateStorageStatus();
    
    // Event Listeners
    document.getElementById('weeklyTarget').addEventListener('change', handleTargetChange);
    document.getElementById('numDays').addEventListener('change', handleDaysChange);
    document.getElementById('earliestStart').addEventListener('change', savePreferences);
    document.getElementById('latestEnd').addEventListener('change', savePreferences);
    document.getElementById('idealStart').addEventListener('change', savePreferences);
    document.getElementById('idealEnd').addEventListener('change', savePreferences);
    
    // Save data when the page is about to be unloaded (important for PWA)
    window.addEventListener('beforeunload', function() {
        console.log('Page is about to unload, saving data...');
        saveToStorage();
    });
    
    // Save data when the page becomes hidden (when PWA is closed)
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            console.log('Page is hidden, saving data...');
            saveToStorage();
        }
    });
    
    // Save data when the page is about to be hidden (iOS Safari specific)
    window.addEventListener('pagehide', function() {
        console.log('Page is being hidden, saving data...');
        saveToStorage();
    });
    
    // Additional save on focus loss (when switching apps)
    window.addEventListener('blur', function() {
        console.log('Window lost focus, saving data...');
        saveToStorage();
    });
    
    // Periodic save as backup (every 30 seconds)
    setInterval(function() {
        console.log('Periodic save...');
        saveToStorage();
    }, 30000);
    
    // Save data when inputs change (additional safety)
    document.addEventListener('input', function(event) {
        if (event.target.type === 'time' || event.target.type === 'number') {
            console.log('Input changed, saving data...');
            setTimeout(saveToStorage, 100); // Small delay to ensure value is updated
        }
    });
});

// Navigation
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const section = this.dataset.section;
            navigateTo(section);
        });
    });
}

function navigateTo(section) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === section) {
            item.classList.add('active');
        }
    });
    
    // Update content sections
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(section).classList.add('active');
}

// Storage Functions
function saveToStorage() {
    try {
        // Create a deep copy to avoid reference issues
        const dataToSave = JSON.parse(JSON.stringify(workData));
        
        // Save all work data to localStorage
        localStorage.setItem('flexitime_workData', JSON.stringify(dataToSave));
        console.log('Data saved to localStorage:', dataToSave);
        
        // Verify the data was saved by reading it back
        const savedData = localStorage.getItem('flexitime_workData');
        if (savedData) {
            console.log('Data verification successful');
            // Show visual feedback that data was saved
            showSaveNotification();
            // Update storage status
            updateStorageStatus();
        } else {
            console.error('Data verification failed - data not found after saving');
            showErrorNotification('Data not saved properly');
        }
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        showErrorNotification('Failed to save data');
    }
}

function showSaveNotification() {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--success);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        font-size: 14px;
        font-weight: 500;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
    `;
    notification.textContent = 'Data saved';
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 10);
    
    // Remove after 2 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}

function showErrorNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--danger);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        font-size: 14px;
        font-weight: 500;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function clearAllData() {
    if (confirm('Are you sure you want to clear all data? This will remove all your work hours, preferences, and constraints.')) {
        try {
            localStorage.removeItem('flexitime_workData');
            
            // Reset to default values
            workData = {
                weeklyTarget: 40,
                numDays: 5,
                dailyHours: [],
                constraints: [],
                preferences: {
                    earliestStart: '07:00',
                    latestEnd: '19:00',
                    idealStart: '09:00',
                    idealEnd: '17:00'
                }
            };
            
            // Reload the UI
            loadFromStorage();
            initializeScheduleInputs();
            loadConstraints();
            updateDashboard();
            updateStorageStatus();
            
            showSaveNotification('All data cleared');
        } catch (error) {
            console.error('Error clearing data:', error);
            showErrorNotification('Failed to clear data');
        }
    }
}

function testStorage() {
    try {
        // Test if localStorage is available
        const testKey = 'flexitime_test';
        const testValue = 'test_data_' + Date.now();
        
        localStorage.setItem(testKey, testValue);
        const retrieved = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        
        if (retrieved === testValue) {
            showSaveNotification('Storage test passed!');
            updateStorageStatus();
        } else {
            showErrorNotification('Storage test failed!');
        }
    } catch (error) {
        console.error('Storage test error:', error);
        showErrorNotification('Storage not available: ' + error.message);
    }
}

function updateStorageStatus() {
    try {
        const savedData = localStorage.getItem('flexitime_workData');
        const statusElement = document.getElementById('storageStatus');
        const lastSaveElement = document.getElementById('lastSave');
        const dataSizeElement = document.getElementById('dataSize');
        
        if (statusElement) {
            statusElement.textContent = savedData ? 'Available' : 'No data';
            statusElement.style.color = savedData ? 'var(--success)' : 'var(--warning)';
        }
        
        if (lastSaveElement) {
            lastSaveElement.textContent = new Date().toLocaleTimeString();
        }
        
        if (dataSizeElement) {
            dataSizeElement.textContent = savedData ? (savedData.length + ' bytes') : '0 bytes';
        }
    } catch (error) {
        console.error('Error updating storage status:', error);
    }
}

function loadFromStorage() {
    try {
        // Try to load saved data from localStorage
        const savedData = localStorage.getItem('flexitime_workData');
        console.log('Loading data from localStorage:', savedData);
        
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            console.log('Parsed data:', parsedData);
            
            // Merge saved data with defaults
            workData = {
                ...workData,
                ...parsedData,
                preferences: {
                    ...workData.preferences,
                    ...parsedData.preferences
                }
            };
            
            console.log('Final workData after loading:', workData);
            console.log('Daily hours loaded:', workData.dailyHours);
        } else {
            console.log('No saved data found in localStorage');
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        // If loading fails, use default values
    }
    
    // Update UI with loaded data
    document.getElementById('weeklyTarget').value = workData.weeklyTarget;
    document.getElementById('numDays').value = workData.numDays;
    document.getElementById('earliestStart').value = workData.preferences.earliestStart;
    document.getElementById('latestEnd').value = workData.preferences.latestEnd;
    document.getElementById('idealStart').value = workData.preferences.idealStart;
    document.getElementById('idealEnd').value = workData.preferences.idealEnd;
}

// Schedule Inputs
function initializeScheduleInputs() {
    const container = document.getElementById('dailyHoursContainer');
    container.innerHTML = '';
    
    const numDays = parseInt(document.getElementById('numDays').value);
    workData.numDays = numDays;
    
    // Initialize daily hours array
    while (workData.dailyHours.length < numDays) {
        workData.dailyHours.push({ day: '', start: '', end: '', hours: 0 });
    }
    workData.dailyHours = workData.dailyHours.slice(0, numDays);
    
    for (let i = 0; i < numDays; i++) {
        const dayData = workData.dailyHours[i];
        const dayCard = document.createElement('div');
        dayCard.className = 'day-card';
        dayCard.id = `day-${i}`;
        
        // Add completed class if hours are logged
        if (dayData.hours > 0) {
            dayCard.classList.add('completed');
        }
        
        dayCard.innerHTML = `
            <div class="day-header">
                <span class="day-name">${dayNames[i]}</span>
                <span class="day-total" id="total-${i}">${dayData.hours > 0 ? dayData.hours.toFixed(1) + ' hrs' : '0.0 hrs'}</span>
            </div>
            <div class="day-inputs">
                <div class="form-group">
                    <label>Start Time</label>
                    <input type="time" id="start-${i}" value="${dayData.start}" onchange="calculateDayHours(${i})">
                </div>
                <div class="form-group">
                    <label>End Time</label>
                    <input type="time" id="end-${i}" value="${dayData.end}" onchange="calculateDayHours(${i})">
                </div>
            </div>
        `;
        
        container.appendChild(dayCard);
    }
}

function calculateDayHours(dayIndex) {
    const startInput = document.getElementById(`start-${dayIndex}`);
    const endInput = document.getElementById(`end-${dayIndex}`);
    const totalDisplay = document.getElementById(`total-${dayIndex}`);
    const dayCard = document.getElementById(`day-${dayIndex}`);
    
    const start = startInput.value;
    const end = endInput.value;
    
    if (start && end) {
        const hours = calculateHoursBetween(start, end);
        workData.dailyHours[dayIndex] = {
            day: dayNames[dayIndex],
            start: start,
            end: end,
            hours: hours
        };
        
        totalDisplay.textContent = `${hours.toFixed(1)} hrs`;
        
        if (hours > 0) {
            dayCard.classList.add('completed');
        } else {
            dayCard.classList.remove('completed');
        }
    } else {
        workData.dailyHours[dayIndex].hours = 0;
        totalDisplay.textContent = '0.0 hrs';
        dayCard.classList.remove('completed');
    }
    
    updateDashboard();
    saveToStorage();
}

function calculateHoursBetween(startTime, endTime) {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    let hours = endHour - startHour;
    let minutes = endMin - startMin;
    
    if (minutes < 0) {
        hours -= 1;
        minutes += 60;
    }
    
    // Handle overnight shifts
    if (hours < 0) {
        hours += 24;
    }
    
    return hours + (minutes / 60);
}

function isValidTimeRange(startTime, endTime, earliestStart, latestEnd) {
    // Check if times are within work day boundaries
    if (startTime < earliestStart || endTime > latestEnd) {
        return false;
    }
    
    // Check if start time is before end time (no overnight shifts)
    if (startTime >= endTime) {
        return false;
    }
    
    return true;
}

function adjustTimeToWorkHours(startTime, endTime, earliestStart, latestEnd, targetHours) {
    // If the times are valid, return them
    if (isValidTimeRange(startTime, endTime, earliestStart, latestEnd)) {
        return { startTime, endTime, hours: calculateHoursBetween(startTime, endTime) };
    }
    
    // Try to fit the target hours within work hours
    let adjustedStart = startTime;
    let adjustedEnd = endTime;
    
    // If start time is too early, move it to earliest start
    if (adjustedStart < earliestStart) {
        adjustedStart = earliestStart;
        adjustedEnd = addHours(adjustedStart, targetHours);
        
        // If this would exceed latest end, use full range
        if (adjustedEnd > latestEnd) {
            adjustedStart = earliestStart;
            adjustedEnd = latestEnd;
        }
    }
    
    // If end time is too late, move it to latest end
    if (adjustedEnd > latestEnd) {
        adjustedEnd = latestEnd;
        adjustedStart = subtractHours(adjustedEnd, targetHours);
        
        // If this would be before earliest start, use full range
        if (adjustedStart < earliestStart) {
            adjustedStart = earliestStart;
            adjustedEnd = latestEnd;
        }
    }
    
    const actualHours = calculateHoursBetween(adjustedStart, adjustedEnd);
    return { startTime: adjustedStart, endTime: adjustedEnd, hours: actualHours };
}

function clearAllHours() {
    if (confirm('Clear all logged hours?')) {
        workData.dailyHours.forEach((day, i) => {
            document.getElementById(`start-${i}`).value = '';
            document.getElementById(`end-${i}`).value = '';
            calculateDayHours(i);
        });
    }
}

// Dashboard Updates
function updateDashboard() {
    const totalWorked = workData.dailyHours.reduce((sum, day) => sum + day.hours, 0);
    const target = parseFloat(document.getElementById('weeklyTarget').value) || 40;
    const remaining = target - totalWorked;
    const progress = (totalWorked / target) * 100;
    
    document.getElementById('totalWorked').textContent = totalWorked.toFixed(1);
    document.getElementById('targetHours').textContent = target.toFixed(1);
    document.getElementById('remainingHours').textContent = remaining.toFixed(1);
    document.getElementById('progressPercent').textContent = Math.min(progress, 100).toFixed(0) + '%';
    document.getElementById('progressBar').style.width = Math.min(progress, 100) + '%';
    
    updateWeeklyChart();
}

function updateWeeklyChart() {
    const chart = document.getElementById('weeklyChart');
    const maxHours = 12; // Max hours for chart scale
    
    let html = '';
    workData.dailyHours.forEach((day, i) => {
        const percentage = (day.hours / maxHours) * 100;
        html += `
            <div class="chart-bar">
                <div class="chart-label">${dayNames[i]}</div>
                <div class="chart-bar-bg">
                    <div class="chart-bar-fill" style="width: ${Math.min(percentage, 100)}%">
                        ${day.hours > 0 ? day.hours.toFixed(1) + 'h' : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    chart.innerHTML = html;
}

// Handle Input Changes
function handleTargetChange() {
    workData.weeklyTarget = parseFloat(this.value) || 40;
    updateDashboard();
    saveToStorage();
}

function handleDaysChange() {
    initializeScheduleInputs();
    loadConstraints();
    updateDashboard();
    saveToStorage();
}

function savePreferences() {
    workData.preferences.earliestStart = document.getElementById('earliestStart').value;
    workData.preferences.latestEnd = document.getElementById('latestEnd').value;
    workData.preferences.idealStart = document.getElementById('idealStart').value;
    workData.preferences.idealEnd = document.getElementById('idealEnd').value;
    saveToStorage();
}

// Constraints Management
function addConstraint() {
    const container = document.getElementById('constraintsContainer');
    
    // Remove empty state if present
    const emptyState = container.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    const constraintId = Date.now();
    const constraintDiv = document.createElement('div');
    constraintDiv.className = 'constraint-item';
    constraintDiv.id = `constraint-${constraintId}`;
    
    constraintDiv.innerHTML = `
        <div class="constraint-content">
            <select class="form-control" id="constraint-day-${constraintId}">
                ${dayNames.slice(0, workData.numDays).map((day, i) => 
                    `<option value="${i}">${day}</option>`
                ).join('')}
            </select>
            <select class="form-control" id="constraint-type-${constraintId}">
                <option value="mustLeaveBy">Must leave by</option>
                <option value="mustStartAfter">Must start after</option>
                <option value="maxHours">Max hours</option>
            </select>
            <input type="time" class="form-control" id="constraint-value-${constraintId}">
        </div>
        <button class="constraint-remove" onclick="removeConstraint(${constraintId})">Remove</button>
    `;
    
    container.appendChild(constraintDiv);
    
    // Add to workData
    workData.constraints.push({
        id: constraintId,
        day: 0,
        type: 'mustLeaveBy',
        value: '17:00'
    });
    
    // Add event listeners
    document.getElementById(`constraint-day-${constraintId}`).addEventListener('change', function() {
        updateConstraint(constraintId, 'day', parseInt(this.value));
    });
    
    document.getElementById(`constraint-type-${constraintId}`).addEventListener('change', function() {
        updateConstraint(constraintId, 'type', this.value);
        updateConstraintInputType(constraintId, this.value);
    });
    
    document.getElementById(`constraint-value-${constraintId}`).addEventListener('change', function() {
        updateConstraint(constraintId, 'value', this.value);
    });
    
    saveToStorage();
}

function loadConstraints() {
    const container = document.getElementById('constraintsContainer');
    container.innerHTML = '';
    
    if (workData.constraints.length === 0) {
        container.innerHTML = '<p class="empty-state">No constraints added. Click "+ Add Constraint" to add one.</p>';
        return;
    }
    
    workData.constraints.forEach(constraint => {
        const constraintDiv = document.createElement('div');
        constraintDiv.className = 'constraint-item';
        constraintDiv.id = `constraint-${constraint.id}`;
        
        constraintDiv.innerHTML = `
            <div class="constraint-content">
                <select class="form-control" id="constraint-day-${constraint.id}">
                    ${dayNames.slice(0, workData.numDays).map((day, i) => 
                        `<option value="${i}" ${i === constraint.day ? 'selected' : ''}>${day}</option>`
                    ).join('')}
                </select>
                <select class="form-control" id="constraint-type-${constraint.id}">
                    <option value="mustLeaveBy" ${constraint.type === 'mustLeaveBy' ? 'selected' : ''}>Must leave by</option>
                    <option value="mustStartAfter" ${constraint.type === 'mustStartAfter' ? 'selected' : ''}>Must start after</option>
                    <option value="maxHours" ${constraint.type === 'maxHours' ? 'selected' : ''}>Max hours</option>
                </select>
                <input type="${constraint.type === 'maxHours' ? 'number' : 'time'}" class="form-control" id="constraint-value-${constraint.id}" value="${constraint.value}">
            </div>
            <button class="constraint-remove" onclick="removeConstraint(${constraint.id})">Remove</button>
        `;
        
        container.appendChild(constraintDiv);
        
        // Add event listeners
        document.getElementById(`constraint-day-${constraint.id}`).addEventListener('change', function() {
            updateConstraint(constraint.id, 'day', parseInt(this.value));
        });
        
        document.getElementById(`constraint-type-${constraint.id}`).addEventListener('change', function() {
            updateConstraint(constraint.id, 'type', this.value);
            updateConstraintInputType(constraint.id, this.value);
        });
        
        document.getElementById(`constraint-value-${constraint.id}`).addEventListener('change', function() {
            updateConstraint(constraint.id, 'value', this.value);
        });
    });
}

function updateConstraintInputType(constraintId, type) {
    const input = document.getElementById(`constraint-value-${constraintId}`);
    if (type === 'maxHours') {
        input.type = 'number';
        input.min = '0';
        input.max = '24';
        input.step = '0.5';
        input.value = '8';
    } else {
        input.type = 'time';
        input.value = '17:00';
    }
}

function updateConstraint(constraintId, field, value) {
    const constraint = workData.constraints.find(c => c.id === constraintId);
    if (constraint) {
        constraint[field] = value;
        saveToStorage();
    }
}

function removeConstraint(constraintId) {
    const constraintDiv = document.getElementById(`constraint-${constraintId}`);
    constraintDiv.remove();
    
    workData.constraints = workData.constraints.filter(c => c.id !== constraintId);
    
    // Check if container is empty
    const container = document.getElementById('constraintsContainer');
    if (container.children.length === 0) {
        container.innerHTML = '<p class="empty-state">No constraints added. Click "+ Add Constraint" to add one.</p>';
    }
    
    saveToStorage();
}

// Calculate and Generate Suggestions
function calculateAndShow() {
    const totalWorked = workData.dailyHours.reduce((sum, day) => sum + day.hours, 0);
    const target = parseFloat(document.getElementById('weeklyTarget').value) || 40;
    const remaining = target - totalWorked;
    
    const unworkedDays = workData.dailyHours.filter(day => day.hours === 0);
    const workedDays = workData.dailyHours.filter(day => day.hours > 0);
    
    generateInsights(totalWorked, target, remaining, unworkedDays, workedDays);
    navigateTo('insights');
}

function generateInsights(totalWorked, target, remaining, unworkedDays, workedDays) {
    const container = document.getElementById('suggestionsContainer');
    container.innerHTML = '';
    
    const suggestions = [];
    
    // Overall Status
    if (remaining <= 0) {
        suggestions.push({
            type: 'success',
            icon: '🎉',
            title: 'Target Achieved!',
            body: `Congratulations! You've completed your ${target} hour target. You've worked ${totalWorked.toFixed(1)} hours total${remaining < 0 ? `, which is ${Math.abs(remaining).toFixed(1)} hours over your target` : ''}.`
        });
        
        if (remaining < -2) {
            suggestions.push({
                type: 'info',
                icon: '⚖️',
                title: 'Work-Life Balance',
                body: `You've worked ${Math.abs(remaining).toFixed(1)} extra hours. Consider taking time off or adjusting next week's schedule for better balance.`
            });
        }
    } else {
        // Calculate suggestions for remaining days
        if (unworkedDays.length === 0) {
            suggestions.push({
                type: 'warning',
                icon: '⚠️',
                title: 'No Remaining Days',
                body: `You still need ${remaining.toFixed(1)} hours but have logged all ${workData.numDays} days. You may need to adjust your existing schedule or plan overtime.`
            });
        } else {
            const avgHoursNeeded = remaining / unworkedDays.length;
            
            suggestions.push({
                type: 'info',
                icon: '📊',
                title: 'Hours Breakdown',
                body: `You've worked ${totalWorked.toFixed(1)} of ${target} hours (${((totalWorked/target)*100).toFixed(0)}%). You need ${remaining.toFixed(1)} more hours across ${unworkedDays.length} remaining day${unworkedDays.length > 1 ? 's' : ''}.`
            });
            
            // Generate schedule suggestions based on preferences and constraints
            const scheduleSuggestion = generateOptimalSchedule(remaining, unworkedDays);
            
            suggestions.push({
                type: avgHoursNeeded > 10 ? 'warning' : avgHoursNeeded > 8 ? 'info' : 'success',
                icon: avgHoursNeeded > 10 ? '⚠️' : avgHoursNeeded > 8 ? '💼' : '✅',
                title: 'Recommended Schedule',
                body: avgHoursNeeded > 10 
                    ? `Warning: You need to average ${avgHoursNeeded.toFixed(1)} hours per day, which is quite high. Consider if this is sustainable or if you need to adjust your weekly target.`
                    : avgHoursNeeded > 8
                    ? `You'll need to work ${avgHoursNeeded.toFixed(1)} hours per day on average. This is manageable but plan for longer days.`
                    : `Great news! You only need ${avgHoursNeeded.toFixed(1)} hours per day on average. This leaves room for flexibility!`,
                schedule: scheduleSuggestion
            });
            
            // Check constraints
            const constraintWarnings = checkConstraints(scheduleSuggestion);
            if (constraintWarnings.length > 0) {
                suggestions.push({
                    type: 'warning',
                    icon: '🚧',
                    title: 'Constraint Conflicts',
                    body: 'The following constraints may conflict with your schedule:',
                    list: constraintWarnings
                });
            }
            
            // Work pattern analysis
            if (workedDays.length > 0) {
                const avgWorked = workedDays.reduce((sum, d) => sum + d.hours, 0) / workedDays.length;
                const consistency = analyzeConsistency(workedDays);
                
                suggestions.push({
                    type: 'info',
                    icon: '📈',
                    title: 'Work Pattern Analysis',
                    body: `Your average work day so far is ${avgWorked.toFixed(1)} hours. ${consistency}`
                });
            }
        }
    }
    
    // Render suggestions
    suggestions.forEach(suggestion => {
        const card = document.createElement('div');
        card.className = `card suggestion-card ${suggestion.type}`;
        
        let scheduleHTML = '';
        if (suggestion.schedule) {
            scheduleHTML = `
                <div class="suggested-schedule">
                    <strong>Suggested Schedule:</strong>
                    ${suggestion.schedule.map(day => `
                        <div class="schedule-day">
                            <span><strong>${day.day}:</strong> ${day.start} - ${day.end}</span>
                            <span>${day.hours.toFixed(1)} hours</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        let listHTML = '';
        if (suggestion.list) {
            listHTML = `
                <ul style="margin-top: 12px; padding-left: 20px;">
                    ${suggestion.list.map(item => `<li>${item}</li>`).join('')}
                </ul>
            `;
        }
        
        card.innerHTML = `
            <div class="suggestion-header">
                <span class="suggestion-icon">${suggestion.icon}</span>
                <span class="suggestion-title">${suggestion.title}</span>
            </div>
            <div class="suggestion-body">
                ${suggestion.body}
                ${scheduleHTML}
                ${listHTML}
            </div>
        `;
        
        container.appendChild(card);
    });
}

function generateOptimalSchedule(remainingHours, unworkedDays) {
    const prefs = workData.preferences;
    const idealStart = prefs.idealStart;
    const idealEnd = prefs.idealEnd;
    const earliestStart = prefs.earliestStart;
    const latestEnd = prefs.latestEnd;
    
    const idealDayLength = calculateHoursBetween(idealStart, idealEnd);
    const maxDayLength = calculateHoursBetween(earliestStart, latestEnd);
    
    const schedule = [];
    let hoursLeft = remainingHours;
    
    // Calculate a more flexible distribution of hours
    const numDays = unworkedDays.length;
    const baseHoursPerDay = Math.floor(remainingHours / numDays);
    const extraHours = remainingHours % numDays;
    
    unworkedDays.forEach((day, index) => {
        const dayIndex = workData.dailyHours.indexOf(day);
        const dayConstraint = workData.constraints.find(c => c.day === dayIndex);
        
        // Distribute hours more flexibly - give extra hours to first few days
        let dayHours = baseHoursPerDay;
        if (index < extraHours) {
            dayHours += 1;
        }
        
        // Ensure we don't exceed maximum possible hours for the day
        dayHours = Math.min(dayHours, maxDayLength);
        
        let startTime, endTime;
        
        // Apply constraints first
        if (dayConstraint) {
            if (dayConstraint.type === 'mustLeaveBy') {
                endTime = dayConstraint.value;
                const maxPossibleHours = calculateHoursBetween(earliestStart, endTime);
                dayHours = Math.min(dayHours, maxPossibleHours);
                startTime = subtractHours(endTime, dayHours);
                
                // Ensure start time is not before earliest start
                if (startTime < earliestStart) {
                    startTime = earliestStart;
                    dayHours = calculateHoursBetween(startTime, endTime);
                }
            } else if (dayConstraint.type === 'mustStartAfter') {
                startTime = dayConstraint.value;
                const maxPossibleHours = calculateHoursBetween(startTime, latestEnd);
                dayHours = Math.min(dayHours, maxPossibleHours);
                endTime = addHours(startTime, dayHours);
                
                // Ensure end time is not after latest end
                if (endTime > latestEnd) {
                    endTime = latestEnd;
                    dayHours = calculateHoursBetween(startTime, endTime);
                }
            } else if (dayConstraint.type === 'maxHours') {
                dayHours = Math.min(dayHours, parseFloat(dayConstraint.value));
                startTime = idealStart;
                endTime = addHours(startTime, dayHours);
            }
        } else {
            // No constraints - try to use ideal times first
            startTime = idealStart;
            endTime = addHours(startTime, dayHours);
            
            // Use the helper function to ensure times are valid
            const adjusted = adjustTimeToWorkHours(startTime, endTime, earliestStart, latestEnd, dayHours);
            startTime = adjusted.startTime;
            endTime = adjusted.endTime;
            dayHours = adjusted.hours;
        }
        
        // Final validation - ensure times are within work hours
        if (!isValidTimeRange(startTime, endTime, earliestStart, latestEnd)) {
            startTime = earliestStart;
            endTime = latestEnd;
            dayHours = calculateHoursBetween(startTime, endTime);
        }
        
        schedule.push({
            day: day.day || dayNames[dayIndex],
            start: startTime,
            end: endTime,
            hours: dayHours
        });
        
        hoursLeft -= dayHours;
    });
    
    return schedule;
}

function addHours(time, hours) {
    const [hour, min] = time.split(':').map(Number);
    const totalMinutes = (hour * 60) + min + (hours * 60);
    const newHour = Math.floor(totalMinutes / 60);
    const newMin = Math.floor(totalMinutes % 60);
    
    // Ensure we don't go beyond 23:59
    if (newHour >= 24) {
        return "23:59";
    }
    
    return `${String(newHour).padStart(2, '0')}:${String(newMin).padStart(2, '0')}`;
}

function subtractHours(time, hours) {
    const [hour, min] = time.split(':').map(Number);
    let totalMinutes = (hour * 60) + min - (hours * 60);
    
    // Ensure we don't go below 00:00
    if (totalMinutes < 0) {
        return "00:00";
    }
    
    const newHour = Math.floor(totalMinutes / 60);
    const newMin = Math.floor(totalMinutes % 60);
    return `${String(newHour).padStart(2, '0')}:${String(newMin).padStart(2, '0')}`;
}

function checkConstraints(schedule) {
    const warnings = [];
    const prefs = workData.preferences;
    
    schedule.forEach(day => {
        // Check if start time is before earliest start
        if (day.start < prefs.earliestStart) {
            warnings.push(`${day.day}: Starts at ${day.start}, which is before your earliest preferred start time (${prefs.earliestStart})`);
        }
        
        // Check if end time is after latest end
        if (day.end > prefs.latestEnd) {
            warnings.push(`${day.day}: Ends at ${day.end}, which is after your latest preferred end time (${prefs.latestEnd})`);
        }
        
        // Check for very long work days
        if (day.hours > 10) {
            warnings.push(`${day.day}: ${day.hours.toFixed(1)} hours is a very long work day - consider breaking it up`);
        }
        
        // Check for impossible schedules (overnight shifts)
        if (day.start > day.end) {
            warnings.push(`${day.day}: Invalid schedule - start time (${day.start}) is after end time (${day.end})`);
        }
        
        // Check for very short work days that might not be realistic
        if (day.hours > 0 && day.hours < 1) {
            warnings.push(`${day.day}: Very short work day (${day.hours.toFixed(1)} hours) - consider combining with another day`);
        }
    });
    
    return warnings;
}

function analyzeConsistency(workedDays) {
    const hours = workedDays.map(d => d.hours);
    const avg = hours.reduce((a, b) => a + b, 0) / hours.length;
    const variance = hours.reduce((sum, h) => sum + Math.pow(h - avg, 2), 0) / hours.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev < 1) {
        return "Your work hours are very consistent, which is great for routine!";
    } else if (stdDev < 2) {
        return "You have moderate variation in your work hours, offering good flexibility.";
    } else {
        return "Your work hours vary significantly. This offers maximum flexibility but may be harder to maintain a routine.";
    }
}