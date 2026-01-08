import React, { useState, useRef, useEffect } from 'react';
import './Main_content.scss';
import ForumCategoryCard  from '../ForumCategoryCard';
import ForumCategoryList from '../ForumCategoryCard/ForumCategoryList';

export const Main_content = () => {
    return (
        <>
            <main>
                <section className='importantInformation'>
                    <h1>Important Information</h1>
                    <ForumCategoryList />
                </section>
            </main>
        </>
    )
}
