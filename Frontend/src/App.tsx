import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './Pages/login';
import FixedDeposit from './Pages/fixed_deposit';

function App() {


  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/fixed-deposit" element={<FixedDeposit />} />
      </Routes>
    </Router>
  )
}


export default App;
