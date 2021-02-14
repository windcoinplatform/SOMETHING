import React from 'react';


        <div className="menu-footer">
            <div>Version</div>
            <div>SOMETHING Team</div>
            <div>
                {socialLinks.map(item =>
                    (<a key={item.id} className={`social ${item.id}`} href={item.url} target="_blank"></a>))}
            </div>
            <div>
                <a className="fade" href="http://161.97.178.27:8080/custom" target="_blank">SOMETHING</a>
            </div>
        </div>
 
export default Footer;
