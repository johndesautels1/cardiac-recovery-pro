class StateManager {
    constructor() {
        this.state = {
            allData: null,
            surgeryDateStr: '',
            patientName: ''
        };
        this.listeners = [];
    }

    // Getter method
    getState() {
        return this.state;
    }

    // Setter method
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notifyListeners();
    }

    // Add an event listener
    addListener(listener) {
        this.listeners.push(listener);
    }

    // Notify all listeners of state change
    notifyListeners() {
        this.listeners.forEach(listener => listener(this.state));
    }
}

// Example usage:
// const stateManager = new StateManager();
// stateManager.addListener((newState) => console.log('State changed:', newState));
// stateManager.setState({ allData: someData, surgeryDateStr: '2023-01-01', patientName: 'John Doe' });
