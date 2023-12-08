// src/components/Header.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  return (
    <header>
       <img src="./nimhans_logo.svg" alt="NIMHANS Logo" className="logo" />
        <h1 className="heading">Geno-Insight</h1>

    </header>
  );
};

export default Header;
